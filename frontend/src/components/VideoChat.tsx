// frontend/src/components/VideoChat.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { SignalPayload } from '../services/socket';

interface VideoChatProps {
    room: string;
    user: string;
    socket: Socket;
    onClose: () => void;
}
interface Peer {
    id: string;
    user: string;
}

export const VideoChat: React.FC<VideoChatProps> = ({ room, user, socket, onClose }) => {
    const localRef = useRef<HTMLVideoElement>(null);
    const remoteRef = useRef<HTMLDivElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
    const [peers, setPeers] = useState<Peer[]>([]);

    // 1. init
    useEffect(() => {
        let mounted = true;
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                if (!mounted) return;
                localStreamRef.current = stream;
                if (localRef.current) localRef.current.srcObject = stream;

                socket.connect();

                // **正确映射 existing-users**
                socket.on('existing-users', ({ members }: { members: { senderId: string; user: string }[] }) => {
                    const mapped = members.map(m => ({ id: m.senderId, user: m.user }));
                    console.log('[VideoChat] existing-users mapped:', mapped);
                    if (mounted) setPeers(mapped);
                });

                socket.on('user-joined', ({ senderId, user: u }: { senderId: string; user: string }) => {
                    console.log('[VideoChat] user-joined:', senderId, u);
                    if (mounted && senderId !== socket.id) {
                        setPeers(prev => [...prev, { id: senderId, user: u }]);
                    }
                });

                socket.on('user-left', ({ senderId }: { senderId: string }) => {
                    console.log('[VideoChat] user-left:', senderId);
                    if (!mounted) return;
                    pcsRef.current[senderId]?.close();
                    delete pcsRef.current[senderId];
                    setPeers(prev => prev.filter(p => p.id !== senderId));
                    const w = document.getElementById(`wrapper-${senderId}`);
                    if (w && remoteRef.current) remoteRef.current.removeChild(w);
                });

                // ... 信令事件保持不变 ...

                socket.emit('joinRoom', { room, user });
            })
            .catch(console.error);

        return () => {
            mounted = false;
            socket.emit('leaveRoom', { room });
            socket.disconnect();
            Object.values(pcsRef.current).forEach(pc => pc.close());
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            if (remoteRef.current) remoteRef.current.innerHTML = '';
        };
    }, [room, user, socket]);

    // 2. peers 更新后创建连接
    useEffect(() => {
        console.log('[VideoChat] peers state changed:', peers);
        const ls = localStreamRef.current;
        if (!ls) return;
        const me = socket.id ?? '';
        peers.forEach(peer => {
            if (peer.id !== me && !pcsRef.current[peer.id]) {
                const isOfferer = me < peer.id;
                console.log(`[VideoChat] createPC -> peer ${peer.id} offerer=${isOfferer}`);
                createPC(peer.id, ls, isOfferer);
            }
        });
    }, [peers, socket]);

    // 3. createPC 实现（同你原来的）
    const createPC = async (peerId: string, ls: MediaStream, offerer: boolean) => {
        // ... same as before ...
    };

    return (
        <div style={{ display: 'flex', padding: 16, alignItems: 'flex-start' }}>
            {/* 本地视频 */}
            <div style={{ marginRight: 16 }}>
                <video ref={localRef} autoPlay muted style={{ width: 240, height: 180 }} />
                <div style={{ textAlign: 'center', marginTop: 4 }}>{user} (me)</div>
            </div>
            {/* 远端视频容器 */}
            <div ref={remoteRef} style={{ display: 'flex', gap: 8 }} />
            <button onClick={onClose} style={{ marginLeft: 16 }}>End Video</button>
        </div>
    );
};
