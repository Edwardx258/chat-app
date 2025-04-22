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
export class ChatGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
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
        const history = this.chatService.getHistory(payload.room);
        client.emit('history', history);
    }

    @SubscribeMessage('message')
    handleMessage(client: Socket, payload: MessageDto) {
        // 完善消息：加时间戳
        const msg: MessageDto = {
            ...payload,
            timestamp: Date.now(),
        };
        // 保存消息历史
        this.chatService.saveMessage(msg.room, msg);
        // 广播给房间内所有客户端
        this.server.to(msg.room).emit('message', msg);
    }
}
