// frontend/src/components/ChatRoom.tsx
import React, { useEffect, useState, ChangeEvent } from 'react';
import { chatSocket as socket, Message } from '../services/socket';

interface ChatRoomProps {
    room: string;
    user: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ room, user }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        // 1. 连接并加入房间
        socket.connect();
        socket.emit('joinRoom', { room, user });

        // 2. 接收历史消息
        socket.on('history', (his: Message[]) => setMessages(his));
        // 3. 接收新消息
        socket.on('message', (msg: Message) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            // 卸载时注销事件并断开聊天连接
            socket.off('history');
            socket.off('message');
            socket.emit('leaveRoom', { room });
            socket.disconnect();
        };
    }, [room, user]);

    const sendText = () => {
        if (!input.trim()) return;
        socket.emit('message', { room, sender: user, content: input });
        setInput('');
    };

    const sendFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const form = new FormData();
        form.append('file', file);

        const res = await fetch(`${process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000'}/upload`, {
            method: 'POST',
            body: form,
        });
        const data = (await res.json()) as { fileUrl: string; fileName: string };

        socket.emit('message', {
            room,
            sender: user,
            fileUrl: `${process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000'}${data.fileUrl}`,
            fileName: data.fileName,
        });
        e.target.value = '';
    };

    return (
        <div style={{ padding: 16, border: '1px solid #ccc' }}>
            <h3>房间：{room}</h3>
            <div style={{ height: 300, overflowY: 'auto', marginBottom: 8 }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                        <strong>{m.sender}</strong>:
                        {m.content && <span> {m.content}</span>}
                        {m.fileUrl && (
                            <div>
                                <a href={m.fileUrl} download={m.fileName}>
                                    📎 {m.fileName}
                                </a>
                            </div>
                        )}
                        <div style={{ fontSize: 12, color: '#999' }}>
                            {new Date(m.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
            </div>
            <div>
                <input
                    style={{ width: '60%' }}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendText()}
                    placeholder="输入文字，Enter 发送"
                />
                <button onClick={sendText}>发送</button>
                <input
                    type="file"
                    accept="*/*"
                    style={{ marginLeft: 8 }}
                    onChange={sendFile}
                />
            </div>
        </div>
    );
};
