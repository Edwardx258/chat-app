// frontend/src/services/socket.ts

import { io, Socket } from 'socket.io-client';

/**
 * 后端 Socket.IO 服务器地址，
 * 生产环境从环境变量读取（.env.production 中的 REACT_APP_SOCKET_URL）
 */
const URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

/**
 * 读取本地存储中的 JWT Token
 */
function getToken(): string {
    return localStorage.getItem('accessToken') || '';
}

/**
 * 文本／文件聊天专用 Socket 实例：
 * 在握手时通过 auth 字段带上 token，后端 ChatGateway 会验证它
 */
export const chatSocket: Socket = io(URL, {
    transports: ['websocket'],
    autoConnect: false,
    auth: { token: getToken() },
});

/**
 * 视频信令专用 Socket 实例：
 * 同样带上 token，以保证视频信令也只能被登录用户使用
 */
export const videoSocket: Socket = io(URL, {
    transports: ['websocket'],
    autoConnect: false,
    auth: { token: getToken() },
});

/**
 * 聊天消息结构
 */
export interface Message {
    room: string;
    sender: string;
    content?: string;
    fileUrl?: string;
    fileName?: string;
    timestamp: number;
}

/**
 * WebRTC 信令消息结构
 */
export interface SignalPayload {
    room: string;
    senderId: string;
    targetId?: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}
