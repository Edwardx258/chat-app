// frontend/src/App.tsx

import React, { useState, useEffect } from 'react';
import { Layout, Input, Button, Typography, Space } from 'antd';
import { AuthForm } from './components/AuthForm';
import { createChatSocket, createVideoSocket } from './services/socket';
import { ChatRoom } from './components/Chatroom';
import { VideoChat } from './components/VideoChat';
import { Socket } from 'socket.io-client';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<string>('');
    const [room, setRoom] = useState<string>('');
    const [joined, setJoined] = useState(false);

    const [chatSock, setChatSock] = useState<Socket | null>(null);
    const [videoOn, setVideoOn] = useState(false);
    const [videoSock, setVideoSock] = useState<Socket | null>(null);

    // 解析用户名
    useEffect(() => {
        if (!token) return;
        try {
            const p = JSON.parse(atob(token.split('.')[1]));
            setUser((p.username as string) || (p['cognito:username'] as string) || '');
        } catch {
            setUser('');
        }
    }, [token]);

    // 创建 chat socket
    useEffect(() => {
        if (token && joined) {
            (async () => {
                const cs = await createChatSocket(token);
                cs.connect();
                setChatSock(cs);
            })();
        }
    }, [token, joined]);

    // 创建并销毁 video socket
    useEffect(() => {
        if (!token || !joined) return;
        let vs: Socket | null = null;
        if (videoOn) {
            (async () => {
                vs = await createVideoSocket(token);
                vs.connect();
                setVideoSock(vs);
            })();
        }
        return () => {
            if (vs) {
                vs.emit('leaveRoom', { room });
                vs.disconnect();
                setVideoSock(null);
            }
        };
    }, [videoOn, token, joined, room]);

    // 1. 未登录
    if (!token) return <AuthForm onLogin={setToken} />;
    // 2. 登录后但没入房
    if (!joined) {
        return (
            <Layout style={{ height: '100vh' }}>
                <Header style={{ color: '#fff', textAlign: 'center' }}>
                    <Title level={2} style={{ color: '#fff', margin: 0 }}>
                        Welcome, {user}
                    </Title>
                </Header>
                <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Space direction="vertical" size="middle">
                        <Input
                            placeholder="Please enter room name"
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            style={{ width: 300 }}
                        />
                        <Button
                            type="primary"
                            disabled={!room.trim()}
                            onClick={() => setJoined(true)}
                            style={{ width: 300 }}
                        >
                            Join
                        </Button>
                    </Space>
                </Content>
            </Layout>
        );
    }
    // 3. 已入房
    if (!chatSock) return null;

    return (
        <Layout style={{ height: '100vh' }}>
            <Header style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4} style={{ color: '#fff', margin: 0 }}>
                    Room：{room} | User：{user}
                </Title>
                <Space>
                    {!videoOn && (
                        <Button type="default" onClick={() => setVideoOn(true)}>
                            Video Chat
                        </Button>
                    )}
                    {videoOn && (
                        <Button danger onClick={() => setVideoOn(false)}>
                            End Video
                        </Button>
                    )}
                </Space>
            </Header>
            <Content style={{ padding: 16, overflow: 'hidden' }}>
                {!videoOn && <ChatRoom room={room} user={user} socket={chatSock} />}
                {videoOn && videoSock && (
                    <VideoChat room={room} user={user} socket={videoSock} />
                )}
            </Content>
        </Layout>
    );
}

export default App;
