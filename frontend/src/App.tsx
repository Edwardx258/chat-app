// frontend/src/App.tsx

import React, { useState, useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { createChatSocket, createVideoSocket } from './services/socket';
import { ChatRoom } from './components/Chatroom';
import { VideoChat } from './components/VideoChat';

function App() {
    const [token, setToken] = useState<string | null>(null);
    const [chatSock, setChatSock] = useState<any>(null);
    const [videoSock, setVideoSock] = useState<any>(null);
    const [user, setUser] = useState<string>('');
    const [videoOn, setVideoOn] = useState(false);
    const room = 'room1';

    // 拿到 token 后立即创建并 connect 两个 socket
    useEffect(() => {
        if (!token) return;
        (async () => {
            console.log('[App] token=', token);
            const cs = await createChatSocket(token);
            cs.connect();
            console.log('[App] chatSock connected, id=', cs.id);
            setChatSock(cs);

            const vs = await createVideoSocket(token);
            vs.connect();
            console.log('[App] videoSock connected, id=', vs.id);
            setVideoSock(vs);

            // 从 JWT 解析用户名
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser((payload.username as string) || (payload['cognito:username'] as string));
            } catch {
                setUser('未知用户');
            }
        })();
    }, [token]);

    if (!token) {
        return <AuthForm onLogin={setToken} />;
    }

    return (
        <div style={{ height: '100vh' }}>
            <div style={{ padding: 16 }}>
                <span>欢迎，{user}</span>
                <button onClick={() => setToken(null)} style={{ marginLeft: 16 }}>
                    登出
                </button>
                <button onClick={() => setVideoOn((v) => !v)} style={{ marginLeft: 16 }}>
                    {videoOn ? '返回文字' : '启动视频'}
                </button>
            </div>
            {!videoOn && chatSock && (
                <ChatRoom room={room} user={user} socket={chatSock} />
            )}
            {videoOn && videoSock && (
                <VideoChat
                    room={room}
                    user={user}
                    socket={videoSock}
                    onClose={() => setVideoOn(false)}
                />
            )}
        </div>
    );
}

export default App;
