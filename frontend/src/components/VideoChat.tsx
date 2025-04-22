// frontend/src/components/VideoChat.tsx
import React, { useEffect, useRef, useState } from 'react';
import { videoSocket as socket, SignalPayload } from '../services/socket';

interface VideoChatProps {
    room: string;
    user: string;
    onClose: () => void;
}

export const VideoChat: React.FC<VideoChatProps> = ({ room, user, onClose }) => {
    const localRef = useRef<HTMLVideoElement>(null);
    const remoteRef = useRef<HTMLDivElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const pcs = useRef<Record<string, RTCPeerConnection>>({});
    const [peers, setPeers] = useState<string[]>([]);

    useEffect(() => {
        let mounted = true;

        // 获取本地流
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                if (!mounted) return;
                localStreamRef.current = stream;
                if (localRef.current) localRef.current.srcObject = stream;

                // 连接视频信令
                socket.connect();
                socket.emit('joinRoom', { room, user });

                // 房间动态
                socket.on('user-joined', ({ senderId }) => {
                    if (senderId !== socket.id) setPeers((p) => [...p, senderId]);
                });
                socket.on('user-left', ({ senderId }) => {
                    pcs.current[senderId]?.close();
                    delete pcs.current[senderId];
                    const vid = document.getElementById(`video-${senderId}`);
                    if (vid && remoteRef.current) remoteRef.current.removeChild(vid);
                    setPeers((p) => p.filter((id) => id !== senderId));
                });

                // 信令处理
                socket.on('video-offer', async ({ senderId, offer }) => {
                    const localStream = localStreamRef.current!;
                    if (!pcs.current[senderId]) createPC(senderId, localStream, false);
                    const pc = pcs.current[senderId]!;
                    await pc.setRemoteDescription(new RTCSessionDescription(offer!));
                    const ans = await pc.createAnswer();
                    await pc.setLocalDescription(ans);
                    socket.emit('video-answer', {
                        room, senderId: socket.id, targetId: senderId, answer: ans,
                    });
                });
                socket.on('video-answer', async ({ senderId, answer }) => {
                    const pc = pcs.current[senderId];
                    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer!));
                });
                socket.on('ice-candidate', async ({ senderId, candidate }) => {
                    const pc = pcs.current[senderId];
                    if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate!));
                });
            })
            .catch(console.error);

        return () => {
            mounted = false;
            // 注销视频事件并断开视频 socket
            socket.off('user-joined');
            socket.off('user-left');
            socket.off('video-offer');
            socket.off('video-answer');
            socket.off('ice-candidate');
            socket.emit('leaveRoom', { room });
            socket.disconnect();
            // 清理资源
            Object.values(pcs.current).forEach((pc) => pc.close());
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            if (remoteRef.current) remoteRef.current.innerHTML = '';
        };
    }, [room, user]);

    // 新 peer 时发起 offer
    useEffect(() => {
        const ls = localStreamRef.current;
        if (ls) peers.forEach((id) => {
            if (!pcs.current[id]) createPC(id, ls, true);
        });
    }, [peers]);

    const createPC = async (
        peerId: string,
        localStream: MediaStream,
        offerer: boolean
    ) => {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        pcs.current[peerId] = pc;
        localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
        pc.ontrack = (e) => {
            const [stream] = e.streams;
            let vid = document.getElementById(`video-${peerId}`) as HTMLVideoElement;
            if (!vid && remoteRef.current) {
                vid = document.createElement('video');
                vid.id = `video-${peerId}`;
                vid.autoplay = true;
                vid.style.width = '240px';
                vid.style.height = '180px';
                remoteRef.current.appendChild(vid);
            }
            if (vid) vid.srcObject = stream;
        };
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit('ice-candidate', {
                    room, senderId: socket.id, targetId: peerId, candidate: e.candidate.toJSON(),
                });
            }
        };
        if (offerer) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('video-offer', {
                room, senderId: socket.id, targetId: peerId, offer,
            });
        }
    };

    return (
        <div style={{ padding: 16 }}>
            <h3>多方视频：{room}</h3>
            <div style={{ display: 'flex', gap: 8 }}>
                <video ref={localRef} autoPlay muted style={{ width: 240, height: 180 }} />
                <div ref={remoteRef} style={{ display: 'flex', gap: 8 }} />
            </div>
            <button onClick={onClose} style={{ marginTop: 12 }}>
                结束视频
            </button>
        </div>
    );
};
