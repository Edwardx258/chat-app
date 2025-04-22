// frontend/src/services/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';
export const socket: Socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: false,
});

// 事件类型声明（可选）
export interface Message {
    room: string;
    sender: string;
    content: string;
    timestamp: number;
}
