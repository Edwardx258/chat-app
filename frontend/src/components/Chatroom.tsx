// frontend/src/components/ChatRoom.tsx
import React, { useEffect, useState, ChangeEvent } from 'react';
import { socket, Message } from '../services/socket';

export const ChatRoom: React.FC<{ room: string; user: string }> = ({ room, user }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        socket.connect();
        socket.emit('joinRoom', { room, user });
        socket.on('history', (his: Message[]) => setMessages(his));
        socket.on('message', (msg: Message) => setMessages(prev => [...prev, msg]));
        return () => {
            socket.off('history');
            socket.off('message');
            socket.disconnect();
        };
    }, [room, user]);

    const sendText = () => {
        if (!input.trim()) return;
        socket.emit('message', { room, sender: user, content: input });
        setInput('');
    };

    const sendImage = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const form = new FormData();
        form.append('file', file);
        // 上传到后端
        const res = await fetch('http://localhost:3000/upload', { method: 'POST', body: form });
        const data = await res.json() as { imageUrl: string };
        // 广播图片消息
        socket.emit('message', {
            room,
            sender: user,
            imageUrl: `http://localhost:3000${data.imageUrl}`,
        });
        // 清空 input[type=file]
        e.target.value = '';
    };

    return (
        <div style={{ padding: 16, border: '1px solid #ccc' }}>
            <h3>Room: {room}</h3>
            <div style={{ height: 300, overflowY: 'auto', marginBottom: 8 }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                        <strong>{m.sender}</strong>：
                        {m.content && <span>{m.content}</span>}
                        {m.imageUrl && (
                            <div>
                                <img
                                    src={m.imageUrl}
                                    alt="img"
                                    style={{ maxWidth: '200px', maxHeight: '200px', display: 'block', marginTop: 4 }}
                                />
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
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendText()}
                    placeholder="输入文字，Enter 发送"
                />
                <button onClick={sendText}>发送</button>
                {/* 图片上传按钮 */}
                <input
                    type="file"
                    accept="image/*"
                    style={{ marginLeft: 8 }}
                    onChange={sendImage}
                />
            </div>
        </div>
    );
};
