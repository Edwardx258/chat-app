// backend/src/dto/message.dto.ts
export class MessageDto {
    room: string;
    sender: string;
    content?: string;      // 文本消息
    imageUrl?: string;     // 图片消息
    timestamp?: number;
}
