// frontend/src/components/ChatRoom.tsx
import React, { useEffect, useState } from 'react';
import { socket, Message } from '../services/socket';

interface ChatRoomProps {
    room: string;
    user: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ room, user }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        socket.connect();
        socket.emit('joinRoom', { room, user });

        // 接收历史
        socket.on('history', (history: Message[]) => {
            setMessages(history);
        });

        // 接收新消息
        socket.on('message', (msg: Message) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off('history');
            socket.off('message');
            socket.disconnect();
        };
    }, [room, user]);

    const send = () => {
        if (!input.trim()) return;
        const msg: Message = { room, sender: user, content: input, timestamp: Date.now() };
        socket.emit('message', msg);
        setInput('');
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: 16 }}>
            <h3>Room: {room}</h3>
            <div style={{ height: 300, overflowY: 'scroll', marginBottom: 8 }}>
                {messages.map((m, i) => (
                    <div key={i}>
                        <strong>{m.sender}</strong>: {m.content}
                        <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
              {new Date(m.timestamp).toLocaleTimeString()}
            </span>
                    </div>
                ))}
            </div>
            <input
                style={{ width: '80%' }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button onClick={send}>发送</button>
        </div>
    );
};
