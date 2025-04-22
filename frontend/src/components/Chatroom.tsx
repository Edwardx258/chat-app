import React, { useEffect, useState, ChangeEvent } from 'react';
import { List, Input, Button, Upload, message, Card, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { chatSocket as socket, Message as Msg } from '../services/socket';

const { TextArea } = Input;
const { Text } = Typography;

interface ChatRoomProps {
    room: string;
    user: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ room, user }) => {
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
        };
    }, [room, user]);

    const sendText = () => {
        if (!input.trim()) return;
        socket.emit('message', { room, sender: user, content: input });
        setInput('');
    };

    const uploadProps = {
        name: 'file',
        action: `${process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000'}/upload`,
        showUploadList: false,
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
                .catch(() => message.error('上传失败'));
            return false;
        },
    };

    return (
        <Card style={{ height: '100%', overflow: 'hidden' }}>
            <List
                dataSource={messages}
                renderItem={(m) => (
                    <List.Item>
                        <List.Item.Meta
                            title={<Text strong>{m.sender}</Text>}
                            description={
                                <>
                                    {m.content && <Text>{m.content}</Text>}
                                    {m.fileUrl && (
                                        <div>
                                            <a href={m.fileUrl} download={m.fileName}>
                                                📎 {m.fileName}
                                            </a>
                                        </div>
                                    )}
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {new Date(m.timestamp).toLocaleTimeString()}
                                    </Text>
                                </>
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
                    placeholder="输入消息，按 Enter 发送"
                />
                <Button type="primary" onClick={sendText} style={{ marginLeft: 8 }}>
                    发送
                </Button>
                <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />} style={{ marginLeft: 8 }}>
                        上传文件
                    </Button>
                </Upload>
            </div>
        </Card>
    );
};
