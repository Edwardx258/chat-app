// backend/src/dto/message.dto.ts
export class MessageDto {
    room: string;
    sender: string;
    // 文本内容
    content?: string;
    // 文件消息：后端返回给前端的可访问 URL
    fileUrl?: string;
    // 文件原始名称，用于前端下载时展示
    fileName?: string;
    // 时间戳
    timestamp?: number;
}
