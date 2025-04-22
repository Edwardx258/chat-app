// frontend/src/App.tsx
import React, { useState } from 'react';
import { ChatRoom } from './components/Chatroom';
import { VideoChat } from './components/VideoChat';

function App() {
    const [joined, setJoined] = useState(false);
    const [room, setRoom] = useState('room1');
    const [user, setUser] = useState('');
    const [videoOn, setVideoOn] = useState(false);

    if (!joined) {
        return (
            <div style={{ padding: 32 }}>
                <h2>加入聊天室</h2>
                <input placeholder="用户名" value={user} onChange={(e) => setUser(e.target.value)} />
                <input placeholder="房间" value={room} onChange={(e) => setRoom(e.target.value)} />
                <button onClick={() => user && setJoined(true)}>进入</button>
            </div>
        );
    }

    return (
        <div>
            {!videoOn && (
                <>
                    <button onClick={() => setVideoOn(true)}>启动视频聊天</button>
                    <ChatRoom room={room} user={user} />
                </>
            )}
            {videoOn && <VideoChat room={room} user={user} onClose={() => setVideoOn(false)} />}
        </div>
    );
}

export default App;
