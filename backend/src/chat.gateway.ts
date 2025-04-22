// backend/src/chat.gateway.ts

import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { MessageDto } from './dto/message.dto';

interface SignalPayload {
    room: string;
    senderId: string;
    targetId?: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}

@WebSocketGateway({ cors: true })
export class ChatGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    constructor(private readonly chatService: ChatService) {}

    afterInit(server: Server) {
        console.log('WebSocket gateway initialized');
    }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        // 当客户端断开（或超时）时，自动从它所有的房间中发出 user-left
        client.rooms.forEach((room) => {
            if (room !== client.id) {
                this.server.to(room).emit('user-left', { senderId: client.id });
            }
        });
    }

    // 用户加入房间：发历史 & 通知其他人
    @SubscribeMessage('joinRoom')
    handleJoin(
        client: Socket,
        payload: { room: string; user: string }
    ) {
        const { room } = payload;
        client.join(room);

        // 1. 发当前房间聊天历史给自己
        const history = this.chatService.getHistory(room);
        client.emit('history', history);

        // 2. 通知本房间其他人，有新用户加入（用于视频信令）
        client.to(room).emit('user-joined', { senderId: client.id });
    }

    // 用户主动离开房间：通知其他人
    @SubscribeMessage('leaveRoom')
    handleLeave(
        client: Socket,
        payload: { room: string }
    ) {
        const { room } = payload;
        client.leave(room);
        client.to(room).emit('user-left', { senderId: client.id });
    }

    // 文本/文件消息处理
    @SubscribeMessage('message')
    handleMessage(
        client: Socket,
        payload: MessageDto
    ) {
        const msg: MessageDto = {
            ...payload,
            timestamp: Date.now(),
        };
        // 保存到历史
        this.chatService.saveMessage(msg.room, msg);
        // 广播到房间内所有在线客户端
        this.server.to(msg.room).emit('message', msg);
    }

    // ====== WebRTC 信令转发 ======

    @SubscribeMessage('video-offer')
    handleVideoOffer(
        client: Socket,
        payload: SignalPayload
    ) {
        if (payload.targetId) {
            this.server
                .to(payload.targetId)
                .emit('video-offer', payload);
        }
    }

    @SubscribeMessage('video-answer')
    handleVideoAnswer(
        client: Socket,
        payload: SignalPayload
    ) {
        if (payload.targetId) {
            this.server
                .to(payload.targetId)
                .emit('video-answer', payload);
        }
    }

    @SubscribeMessage('ice-candidate')
    handleIceCandidate(
        client: Socket,
        payload: SignalPayload
    ) {
        if (payload.targetId) {
            this.server
                .to(payload.targetId)
                .emit('ice-candidate', payload);
        }
    }
}
