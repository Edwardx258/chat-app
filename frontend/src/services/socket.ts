// frontend/src/services/socket.ts
import { io, Socket } from 'socket.io-client';

const URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

// 专门用于文本/文件聊天
export const chatSocket: Socket = io(URL, {
    transports: ['websocket'],
    autoConnect: false,
});

// 专门用于视频信令
export const videoSocket: Socket = io(URL, {
    transports: ['websocket'],
    autoConnect: false,
});

export interface Message {
    room: string;
    sender: string;
    content?: string;
    fileUrl?: string;
    fileName?: string;
    timestamp: number;
}

export interface SignalPayload {
    room: string;
    senderId: string;
    targetId?: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}
