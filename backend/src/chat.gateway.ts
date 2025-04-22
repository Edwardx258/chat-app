import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
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
export class ChatGateway {
    @WebSocketServer() server: Server;
    // 保存 socket.id 到 用户名 的映射
    private userMap = new Map<string, string>();

    constructor(private readonly chatService: ChatService) {}

    @SubscribeMessage('joinRoom')
    handleJoin(
        client: Socket,
        payload: { room: string; user: string }
    ) {
        const { room, user } = payload;
        // 记录用户名
        this.userMap.set(client.id, user);

        // 1. 聊天历史
        const history = this.chatService.getHistory(room);
        client.emit('history', history);

        // 2. 已有用户列表（带用户名）
        const roomSet = this.server.sockets.adapter.rooms.get(room) || new Set();
        const existing = Array.from(roomSet).map((id) => ({
            id,
            user: this.userMap.get(id) || '未知',
        }));
        client.emit('existing-users', { members: existing });

        // 3. 加入房间
        client.join(room);

        // 4. 通知其他人：有人加入并带用户名
        client.to(room).emit('user-joined', {
            senderId: client.id,
            user,
        });
    }

    @SubscribeMessage('leaveRoom')
    handleLeave(
        client: Socket,
        payload: { room: string }
    ) {
        const { room } = payload;
        const user = this.userMap.get(client.id) || '未知';
        client.leave(room);
        client.to(room).emit('user-left', {
            senderId: client.id,
            user,
        });
        this.userMap.delete(client.id);
    }

    @SubscribeMessage('message')
    handleMessage(client: Socket, payload: MessageDto) {
        const msg: MessageDto = { ...payload, timestamp: Date.now() };
        this.chatService.saveMessage(msg.room, msg);
        this.server.to(msg.room).emit('message', msg);
    }

    @SubscribeMessage('video-offer')
    handleVideoOffer(client: Socket, payload: SignalPayload) {
        if (payload.targetId) {
            this.server.to(payload.targetId).emit('video-offer', payload);
        }
    }

    @SubscribeMessage('video-answer')
    handleVideoAnswer(client: Socket, payload: SignalPayload) {
        if (payload.targetId) {
            this.server.to(payload.targetId).emit('video-answer', payload);
        }
    }

    @SubscribeMessage('ice-candidate')
    handleIce(client: Socket, payload: SignalPayload) {
        if (payload.targetId) {
            this.server.to(payload.targetId).emit('ice-candidate', payload);
        }
    }
}
