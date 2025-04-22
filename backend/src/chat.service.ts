// backend/src/chat.service.ts
import { Injectable } from '@nestjs/common';
import { MessageDto } from './dto/message.dto';

@Injectable()
export class ChatService {
    // room -> messages[]
    private readonly messages: Record<string, MessageDto[]> = {};

    // 保存消息
    saveMessage(room: string, msg: MessageDto) {
        if (!this.messages[room]) {
            this.messages[room] = [];
        }
        this.messages[room].push(msg);
    }

    // 获取房间历史
    getHistory(room: string): MessageDto[] {
        return this.messages[room] || [];
    }
}
