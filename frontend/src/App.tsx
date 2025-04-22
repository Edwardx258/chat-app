import React, { useState } from 'react';
import { Layout, Button, Input, Typography, Space } from 'antd';
import { ChatRoom } from './components/Chatroom';
import { VideoChat } from './components/VideoChat';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
    const [joined, setJoined] = useState(false);
    const [room, setRoom] = useState('room1');
    const [user, setUser] = useState('');
    const [videoOn, setVideoOn] = useState(false);

    if (!joined) {
        return (
            <Layout style={{ height: '100vh' }}>
                <Header style={{ color: '#fff', textAlign: 'center' }}>
                    <Title level={2} style={{ color: '#fff', margin: 0 }}>
                        欢迎使用即时通讯应用
                    </Title>
                </Header>
                <Content
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Space direction="vertical" size="middle">
                        <Input
                            placeholder="用户名"
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                            style={{ width: 300 }}
                        />
                        <Input
                            placeholder="房间名"
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            style={{ width: 300 }}
                        />
                        <Button
                            type="primary"
                            onClick={() => user && setJoined(true)}
                            style={{ width: 300 }}
                        >
                            加入聊天室
                        </Button>
                    </Space>
                </Content>
            </Layout>
        );
    }

    return (
        <Layout style={{ height: '100vh' }}>
            <Header style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4} style={{ color: '#fff', margin: 0 }}>
                    房间：{room} | 用户：{user}
                </Title>
                <Space>
                    {!videoOn && (
                        <Button onClick={() => setVideoOn(true)} type="default">
                            启动视频
                        </Button>
                    )}
                    {videoOn && (
                        <Button onClick={() => setVideoOn(false)} danger>
                            结束视频
                        </Button>
                    )}
                </Space>
            </Header>
            <Content style={{ padding: '16px', overflow: 'hidden' }}>
                {!videoOn && <ChatRoom room={room} user={user} />}
                {videoOn && <VideoChat room={room} user={user} onClose={() => setVideoOn(false)} />}
            </Content>
        </Layout>
    );
}

export default App;
