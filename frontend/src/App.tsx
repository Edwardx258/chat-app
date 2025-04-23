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

    // 拿到 token 后马上创建并连接两个 socket
    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const cs = await createChatSocket(token);
                cs.connect();
                setChatSock(cs);

                const vs = await createVideoSocket(token);
                vs.connect();
                setVideoSock(vs);

                // 从 JWT 中解析用户名
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser(payload.username || payload['cognito:username']);
            } catch (err) {
                console.error(err);
            }
        })();
    }, [token]);

    // 未登录就显示 AuthForm
    if (!token) {
        return <AuthForm onLogin={setToken} />;
    }

    // 登录后显示 ChatRoom 或 VideoChat
    return (
        <div>
            <div style={{ padding: 16 }}>
                <span>Welcome，{user}</span>
                <button onClick={() => setToken(null)} style={{ marginLeft: 8 }}>
                    Logout
                </button>
                <button onClick={() => setVideoOn((v) => !v)} style={{ marginLeft: 8 }}>
                    {videoOn ? 'Text' : 'Video Chat'}
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
