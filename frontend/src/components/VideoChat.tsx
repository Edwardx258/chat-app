// frontend/src/components/VideoChat.tsx
import React, { useEffect, useRef, useState } from 'react';
import { videoSocket as socket, SignalPayload } from '../services/socket';

interface VideoChatProps {
    room: string;
    user: string;
    onClose: () => void;
}

interface Peer {
    id: string;
    user: string;
}

export const VideoChat: React.FC<VideoChatProps> = ({ room, user, onClose }) => {
    const localRef = useRef<HTMLVideoElement>(null);
    const remoteRef = useRef<HTMLDivElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const pcs = useRef<Record<string, RTCPeerConnection>>({});
    const [peers, setPeers] = useState<Peer[]>([]);

    // 1. 媒体流 + 信令注册 + 加入房间
    useEffect(() => {
        let mounted = true;

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            if (!mounted) return;
            localStreamRef.current = stream;
            if (localRef.current) localRef.current.srcObject = stream;

            socket.connect();

            socket.on('existing-users', (data: { members: Peer[] }) => {
                if (mounted) setPeers(data.members);
            });

            socket.on('user-joined', (data: { senderId: string; user: string }) => {
                if (mounted && data.senderId !== socket.id) {
                    setPeers((prev) => [...prev, { id: data.senderId, user: data.user }]);
                }
            });

            socket.on('user-left', (data: { senderId: string }) => {
                if (!mounted) return;
                pcs.current[data.senderId]?.close();
                delete pcs.current[data.senderId];
                setPeers((prev) => prev.filter((p) => p.id !== data.senderId));
                const wrapper = document.getElementById(`wrapper-${data.senderId}`);
                if (wrapper && remoteRef.current) {
                    remoteRef.current.removeChild(wrapper);
                }
            });

            socket.on('video-offer', async (payload: SignalPayload) => {
                const { senderId, offer } = payload;
                const ls = localStreamRef.current!;
                if (!pcs.current[senderId]) {
                    await createPC(senderId, ls, false);
                }
                const pc = pcs.current[senderId]!;
                await pc.setRemoteDescription(new RTCSessionDescription(offer!));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('video-answer', {
                    room,
                    senderId: socket.id,
                    targetId: senderId,
                    answer,
                });
            });

            socket.on('video-answer', async (payload: SignalPayload) => {
                const { senderId, answer } = payload;
                const pc = pcs.current[senderId];
                if (pc && pc.signalingState === 'have-local-offer') {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(answer!));
                    } catch (e) {
                        console.error('Failed to set remote answer:', e);
                    }
                }
            });

            socket.on('ice-candidate', async (payload: SignalPayload) => {
                const { senderId, candidate } = payload;
                const pc = pcs.current[senderId];
                if (pc) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate!));
                    } catch (e) {
                        console.error('Failed to add ICE candidate:', e);
                    }
                }
            });

            socket.emit('joinRoom', { room, user });
        }).catch(console.error);

        return () => {
            mounted = false;
            socket.emit('leaveRoom', { room });
            socket.disconnect();
            Object.values(pcs.current).forEach((pc) => pc.close());
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            if (remoteRef.current) remoteRef.current.innerHTML = '';
        };
    }, [room, user]);

    // 2. peers 更新后建立连接（根据 ID 比较决定谁发起 offer）
    useEffect(() => {
        const ls = localStreamRef.current;
        if (!ls) return;
        const sid = socket.id ?? ''; // 为空字符串时不会小于任何有效 id
        peers.forEach((peer) => {
            if (peer.id !== sid && !pcs.current[peer.id]) {
                const isOfferer = sid < peer.id;
                createPC(peer.id, ls, isOfferer);
            }
        });
    }, [peers]);

    // 3. 创建 RTCPeerConnection
    const createPC = async (peerId: string, ls: MediaStream, offerer: boolean) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcs.current[peerId] = pc;

        ls.getTracks().forEach((track) => pc.addTrack(track, ls));

        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            let wrapper = document.getElementById(`wrapper-${peerId}`);
            if (!wrapper && remoteRef.current) {
                wrapper = document.createElement('div');
                wrapper.id = `wrapper-${peerId}`;
                wrapper.style.marginRight = '8px';

                const vid = document.createElement('video');
                vid.id = `video-${peerId}`;
                vid.autoplay = true;
                vid.style.width = '240px';
                vid.style.height = '180px';
                wrapper.appendChild(vid);

                const label = document.createElement('div');
                const peer = peers.find((p) => p.id === peerId);
                label.innerText = peer?.user || '未知';
                label.style.textAlign = 'center';
                label.style.marginTop = '4px';
                wrapper.appendChild(label);

                remoteRef.current.appendChild(wrapper);
            }
            const vidEl = document.getElementById(`video-${peerId}`) as HTMLVideoElement;
            if (vidEl) vidEl.srcObject = remoteStream;
        };

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit('ice-candidate', {
                    room,
                    senderId: socket.id,
                    targetId: peerId,
                    candidate: e.candidate.toJSON(),
                });
            }
        };

        if (offerer) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('video-offer', {
                room,
                senderId: socket.id,
                targetId: peerId,
                offer,
            });
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', padding: 16 }}>
            <div style={{ marginRight: 16 }}>
                <video ref={localRef} autoPlay muted style={{ width: 240, height: 180 }} />
                <div style={{ textAlign: 'center', marginTop: 4 }}>{user} (我)</div>
            </div>
            <div ref={remoteRef} style={{ display: 'flex', gap: 8 }} />
            <button onClick={onClose} style={{ marginLeft: 16 }}>
                结束视频
            </button>
        </div>
    );
};
