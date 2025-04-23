// backend/src/chat.gateway.ts

import { UseGuards, Logger } from '@nestjs/common';
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ChatService } from './chat.service';
import { MessageDto } from './dto/message.dto';
import { WsJwtGuard } from './auth/ws-jwt.guard';

interface SignalPayload {
    room: string;
    senderId: string;
    targetId?: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}

@UseGuards(WsJwtGuard)
@WebSocketGateway({
    cors: {
        origin: ['https://your.domain.com', 'http://localhost:3001'],
        credentials: true,
    },
})
export class ChatGateway
    implements OnGatewayInit, OnGatewayConnection<Socket>, OnGatewayDisconnect<Socket>
{
    private readonly logger = new Logger(ChatGateway.name);

    constructor(private readonly chatService: ChatService) {}

    @WebSocketServer()
    server: Server;

    /** WebSocket gateway 初始化后调用 */
    afterInit(server: Server) {
        this.logger.log('WebSocket gateway initialized');
    }

    /** 有新客户端连接时调用 */
    handleConnection(@ConnectedSocket() client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    /** 客户端断开时调用 */
    handleDisconnect(@ConnectedSocket() client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        // 通知房间内其他用户，该用户已离开
        client.rooms.forEach((room) => {
            if (room !== client.id) {
                this.server.to(room).emit('user-left', {
                    senderId: client.id,
                    user: (client.data.user as any)?.username || '未知',
                });
            }
        });
    }

    /** 用户加入指定房间 */
    @SubscribeMessage('joinRoom')
    handleJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { room: string; user: string },
    ) {
        const { room, user } = payload;

        // 1. 给自己发送历史消息
        const history = this.chatService.getHistory(room);
        client.emit('history', history);

        // 2. 获取房间已有成员（带用户名）
        const roomSet = this.server.sockets.adapter.rooms.get(room) || new Set<string>();
        const existing = Array.from(roomSet).map((id) => ({
            senderId: id,
            user: (this.server.sockets.sockets.get(id)?.data.user as any)?.username || '未知',
        }));
        client.emit('existing-users', { members: existing });

        // 3. 加入房间
        client.join(room);

        // 4. 通知其他成员，新用户加入
        client.to(room).emit('user-joined', {
            senderId: client.id,
            user,
        });
    }

    /** 用户主动离开房间 */
    @SubscribeMessage('leaveRoom')
    handleLeave(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { room: string },
    ) {
        const { room } = payload;
        const username = (client.data.user as any)?.username || '未知';
        client.leave(room);
        client.to(room).emit('user-left', {
            senderId: client.id,
            user: username,
        });
    }

    /** 文本/文件消息处理 */
    @SubscribeMessage('message')
    handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: MessageDto,
    ) {
        const msg: MessageDto = {
            ...payload,
            timestamp: Date.now(),
        };
        this.chatService.saveMessage(msg.room, msg);
        this.server.to(msg.room).emit('message', msg);
    }

    /** WebRTC 信令：offer */
    @SubscribeMessage('video-offer')
    handleVideoOffer(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: SignalPayload,
    ) {
        const { targetId } = payload;
        if (targetId) {
            this.server.to(targetId).emit('video-offer', payload);
        }
    }

    /** WebRTC 信令：answer */
    @SubscribeMessage('video-answer')
    handleVideoAnswer(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: SignalPayload,
    ) {
        const { targetId } = payload;
        if (targetId) {
            this.server.to(targetId).emit('video-answer', payload);
        }
    }

    /** WebRTC 信令：ICE candidate */
    @SubscribeMessage('ice-candidate')
    handleIceCandidate(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: SignalPayload,
    ) {
        const { targetId } = payload;
        if (targetId) {
            this.server.to(targetId).emit('ice-candidate', payload);
        }
    }
}
