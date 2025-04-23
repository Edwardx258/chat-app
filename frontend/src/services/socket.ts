// frontend/src/services/socket.ts

import { io, Socket } from 'socket.io-client';

const URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

/**
 * 创建一个带 JWT 的聊天 socket
 */
export async function createChatSocket(token: string): Promise<Socket> {
    const socket = io(URL, {
        transports: ['websocket'],
        autoConnect: false,
        auth: { token },
    });
    return socket;
}

/**
 * 创建一个带 JWT 的视频信令 socket
 */
export async function createVideoSocket(token: string): Promise<Socket> {
    const socket = io(URL, {
        transports: ['websocket'],
        autoConnect: false,
        auth: { token },
    });
    return socket;
}

// 消息类型
export interface Message {
    room: string;
    sender: string;
    content?: string;
    fileUrl?: string;
    fileName?: string;
    timestamp: number;
}

// WebRTC 信令类型
export interface SignalPayload {
    room: string;
    senderId: string;
    targetId?: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}
