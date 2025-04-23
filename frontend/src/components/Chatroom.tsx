// frontend/src/components/Chatroom.tsx

import React, { useEffect, useState } from 'react';
import { List, Input, Button, Upload, message, Card, Typography, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { Socket } from 'socket.io-client';
import { Message as Msg } from '../services/socket';

const { TextArea } = Input;
const { Text } = Typography;

interface ChatRoomProps {
    room: string;
    user: string;
    socket: Socket;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ room, user, socket }) => {
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        socket.connect();
        socket.emit('joinRoom', { room, user });

        socket.on('history', (his: Msg[]) => setMessages(his));
        socket.on('message', (msg: Msg) => setMessages((prev) => [...prev, msg]));

        return () => {
            socket.off('history');
            socket.off('message');
            socket.emit('leaveRoom', { room });
            socket.disconnect();
        };
    }, [room, user, socket]);

    const sendText = () => {
        const text = input.trim();
        if (!text) return;
        socket.emit('message', { room, sender: user, content: text });
        setInput('');
    };

    // 新增：JS 下载而不跳转
    const handleFileDownload = (url: string, filename: string) => {
        fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error('Network error');
                return res.blob();
            })
            .then((blob) => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            })
            .catch(() => message.error('Download Fail'));
    };

    const uploadProps = {
        name: 'file',
        action: `${process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000'}/upload`,
        showUploadList: false as const,
        beforeUpload: (file: File) => {
            const form = new FormData();
            form.append('file', file);
            fetch(uploadProps.action, { method: 'POST', body: form })
                .then((res) => res.json())
                .then((data) => {
                    socket.emit('message', {
                        room,
                        sender: user,
                        fileUrl: `${process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000'}${data.fileUrl}`,
                        fileName: data.fileName,
                    });
                })
                .catch(() => message.error('Upload Fail'));
            return false;
        },
    };

    return (
        <Card style={{ height: '100%', overflow: 'hidden' }}>
            <List
                dataSource={messages}
                renderItem={(m) => (
                    <List.Item key={m.timestamp + m.sender}>
                        <List.Item.Meta
                            title={<Text strong>{m.sender}</Text>}
                            description={
                                <Space direction="vertical">
                                    {m.content && <Text>{m.content}</Text>}
                                    {m.fileUrl && (
                                        <Button
                                            type="link"
                                            onClick={() => handleFileDownload(m.fileUrl!, m.fileName!)}
                                        >
                                            📎 {m.fileName}
                                        </Button>
                                    )}
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {new Date(m.timestamp).toLocaleTimeString()}
                                    </Text>
                                </Space>
                            }
                        />
                    </List.Item>
                )}
                style={{ height: 'calc(100% - 100px)', overflowY: 'auto' }}
            />
            <div style={{ display: 'flex', marginTop: 8 }}>
                <TextArea
                    rows={2}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onPressEnter={sendText}
                    placeholder="Enter your text here"
                />
                <Button type="primary" onClick={sendText} style={{ marginLeft: 8 }}>
                    Send
                </Button>
                <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />} style={{ marginLeft: 8 }}>
                        Upload
                    </Button>
                </Upload>
            </div>
        </Card>
    );
};
