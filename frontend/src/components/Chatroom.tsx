// frontend/src/components/ChatRoom.tsx
import React, { useEffect, useState, ChangeEvent } from 'react';
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

        socket.on('history', (his: Message[]) => setMessages(his));
        socket.on('message', (msg: Message) =>
            setMessages((prev) => [...prev, msg]),
        );

        return () => {
            socket.off('history');
            socket.off('message');
            socket.disconnect();
        };
    }, [room, user]);

    // 发送文本
    const sendText = () => {
        if (!input.trim()) return;
        socket.emit('message', { room, sender: user, content: input });
        setInput('');
    };

    // 上传并发送文件
    const sendFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const form = new FormData();
        form.append('file', file);

        // 上传到后端
        const res = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: form,
        });
        const data = (await res.json()) as { fileUrl: string; fileName: string };

        // 发送文件消息
        socket.emit('message', {
            room,
            sender: user,
            fileUrl: `http://localhost:3000${data.fileUrl}`,
            fileName: data.fileName,
        });

        // 清空 input
        e.target.value = '';
    };

    return (
        <div style={{ padding: 16, border: '1px solid #ccc' }}>
            <h3>Room: {room}</h3>

            <div
                style={{
                    height: 300,
                    overflowY: 'auto',
                    marginBottom: 8,
                    border: '1px solid #eee',
                    padding: 8,
                }}
            >
                {messages.map((m, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                        <strong>{m.sender}</strong>：
                        {m.content && <span>{m.content}</span>}
                        {m.fileUrl && (
                            <div>
                                <a
                                    href={m.fileUrl}
                                    download={m.fileName}
                                    style={{ color: '#1890ff' }}
                                >
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
                {/* 任意文件上传按钮 */}
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
