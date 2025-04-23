import { io, Socket } from 'socket.io-client';

const URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

export async function createChatSocket(token: string): Promise<Socket> {
    return io(URL, {
        transports: ['websocket'],
        autoConnect: false,
        auth: { token },
    });
}
export async function createVideoSocket(token: string): Promise<Socket> {
    return io(URL, {
        transports: ['websocket'],
        autoConnect: false,
        auth: { token },
    });
}
