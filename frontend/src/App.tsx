import React, { useEffect, useState } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { ChatRoom } from './components/Chatroom';
import { VideoChat } from './components/VideoChat';
import { createChatSocket, createVideoSocket } from './services/socket';

export default function App() {
    return (
        <Authenticator>
            {() => <ChatUI />}
        </Authenticator>
    );
}

function ChatUI() {
    const { user, signOut } = useAuthenticator((ctx) => [ctx.user]);
    const username = user.username;
    //const token = user.signInUserSession.getIdToken().getJwtToken();
    const cognitoUser = user as unknown as { getSignInUserSession(): any };
    const session = cognitoUser.getSignInUserSession();
    const token = session.getIdToken().getJwtToken();

    const [chatSock, setChatSock] = useState<any>(null);
    const [videoSock, setVideoSock] = useState<any>(null);
    const [videoOn, setVideoOn] = useState(false);

    useEffect(() => {
        (async () => {
            const cs = await createChatSocket(token);
            cs.connect();
            setChatSock(cs);
            const vs = await createVideoSocket(token);
            vs.connect();
            setVideoSock(vs);
        })();
    }, [token]);

    if (!chatSock || !videoSock) return null;

    return (
        <>
            <div style={{ padding: 16 }}>
                欢迎，{username}！
                <button onClick={() => signOut()}>登出</button>
                <button onClick={() => setVideoOn((v) => !v)}>
                    {videoOn ? '返回文字' : '启动视频'}
                </button>
            </div>
            {!videoOn ? (
                <ChatRoom room="room1" user={username} socket={chatSock} />
            ) : (
                <VideoChat
                    room="room1"
                    user={username}
                    socket={videoSock}
                    onClose={() => setVideoOn(false)}
                />
            )}
        </>
    );
}
