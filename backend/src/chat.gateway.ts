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

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(private readonly chatService: ChatService) {}

    @WebSocketServer()
    server: Server;

    afterInit(server: Server) {
        console.log('WebSocket initialized');
    }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinRoom')
    handleJoin(client: Socket, payload: { room: string; user: string }) {
        client.join(payload.room);
        // 发送历史消息给新加入者
        const history = this.chatService.getHistory(payload.room);
        client.emit('history', history);
    }

    @SubscribeMessage('message')
    handleMessage(client: Socket, payload: MessageDto) {
        // 存储
        this.chatService.saveMessage(payload.room, { ...payload, timestamp: Date.now() });
        // 广播
        this.server.to(payload.room).emit('message', payload);
    }
}
