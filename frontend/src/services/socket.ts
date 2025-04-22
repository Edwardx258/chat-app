// frontend/src/services/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

export const socket: Socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: false,
});

// 消息结构，注意新增了 fileName 字段
export interface Message {
    room: string;
    sender: string;
    content?: string;
    // 文件消息
    fileUrl?: string;
    fileName?: string;
    timestamp: number;
}
