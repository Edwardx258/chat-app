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

    // 1. 初始化本地流、注册信令、加入房间
    useEffect(() => {
        let mounted = true;

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                if (!mounted) return;
                localStreamRef.current = stream;
                localRef.current && (localRef.current.srcObject = stream);

                socket.connect();
                console.log('[VideoChat] connect socket.id=', socket.id);

                // 打印所有信令事件
                socket.onAny((event, payload) => {
                    console.log('[Signal]', event, payload);
                });

                socket.on('existing-users', ({ members }: { members: { senderId: string; user: string }[] }) => {
                    const mapped = members.map(m => ({ id: m.senderId, user: m.user }));
                    console.log('[VideoChat] existing-users →', mapped);
                    mounted && setPeers(mapped);
                });

                socket.on('user-joined', ({ senderId, user: u }: { senderId: string; user: string }) => {
                    console.log('[VideoChat] user-joined →', senderId, u);
                    if (mounted && senderId !== socket.id) {
                        setPeers(prev => [...prev, { id: senderId, user: u }]);
                    }
                });

                socket.on('user-left', ({ senderId }: { senderId: string }) => {
                    console.log('[VideoChat] user-left →', senderId);
                    if (!mounted) return;
                    pcsRef.current[senderId]?.close();
                    delete pcsRef.current[senderId];
                    setPeers(prev => prev.filter(p => p.id !== senderId));
                    const w = document.getElementById(`wrapper-${senderId}`);
                    w && remoteRef.current && remoteRef.current.removeChild(w);
                });

                socket.on('video-offer', async (pl: SignalPayload) => {
                    const { senderId, offer } = pl;
                    console.log('[VideoChat] video-offer from', senderId);
                    const ls = localStreamRef.current!;
                    if (!pcsRef.current[senderId]) {
                        await createPC(senderId, ls, false);
                    }
                    const pc = pcsRef.current[senderId]!;
                    await pc.setRemoteDescription(new RTCSessionDescription(offer!));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('video-answer', { room, senderId: socket.id, targetId: senderId, answer });
                });

                socket.on('video-answer', async (pl: SignalPayload) => {
                    console.log('[VideoChat] video-answer:', pl.senderId);
                    const pc = pcsRef.current[pl.senderId];
                    if (pc && pc.signalingState === 'have-local-offer') {
                        await pc.setRemoteDescription(new RTCSessionDescription(pl.answer!));
                    }
                });

                socket.on('ice-candidate', async (pl: SignalPayload) => {
                    console.log('[VideoChat] ice-candidate from', pl.senderId);
                    const pc = pcsRef.current[pl.senderId];
                    pc && await pc.addIceCandidate(new RTCIceCandidate(pl.candidate!));
                });

                socket.emit('joinRoom', { room, user });
            })
            .catch(console.error);

        return () => {
            mounted = false;
            socket.emit('leaveRoom', { room });
            socket.disconnect();
            Object.values(pcsRef.current).forEach(pc => pc.close());
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            remoteRef.current && (remoteRef.current.innerHTML = '');
        };
    }, [room, user, socket]);

    // 2. peers 变更后建立连接
    useEffect(() => {
        console.log('[VideoChat] peers list updated', peers);
        const ls = localStreamRef.current;
        if (!ls) return;
        const me = socket.id ?? '';
        peers.forEach(peer => {
            if (peer.id !== me && !pcsRef.current[peer.id]) {
                const isOfferer = me < peer.id;
                console.log(`[VideoChat] createPC → peer ${peer.id}, offerer=${isOfferer}`);
                createPC(peer.id, ls, isOfferer);
            }
        });
    }, [peers, socket]);

    // 3. 创建 RTCPeerConnection 并附加事件
    const createPC = async (peerId: string, ls: MediaStream, offerer: boolean) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcsRef.current[peerId] = pc;

        // 日志 state 变化
        pc.oniceconnectionstatechange = () => console.log(`[PC ${peerId}] iceConnectionState=`, pc.iceConnectionState);
        pc.onconnectionstatechange = () => console.log(`[PC ${peerId}] connectionState=`, (pc as any).connectionState);
        pc.onsignalingstatechange = () => console.log(`[PC ${peerId}] signalingState=`, pc.signalingState);

        // 添加本地轨道
        ls.getTracks().forEach(t => pc.addTrack(t, ls));

        // 接收远端轨道
        pc.ontrack = (evt) => {
            const [remoteStream] = evt.streams;
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

                const lbl = document.createElement('div');
                lbl.innerText = peers.find(p => p.id === peerId)?.user || '未知';
                lbl.style.textAlign = 'center';
                lbl.style.marginTop = '4px';
                wrapper.appendChild(lbl);

                remoteRef.current.appendChild(wrapper);
            }
            const vidEl = document.getElementById(`video-${peerId}`) as HTMLVideoElement;
            vidEl && (vidEl.srcObject = remoteStream);
        };

        // 收集并发送 ICE Candidate
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

        // 如果自己是 offerer，先发 offer
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
        <div style={{ display: 'flex', padding: 16, alignItems: 'flex-start' }}>
            <div style={{ marginRight: 16 }}>
                <video ref={localRef} autoPlay muted style={{ width: 240, height: 180 }} />
                <div style={{ textAlign: 'center', marginTop: 4 }}>{user} (我)</div>
            </div>
            <div ref={remoteRef} style={{ display: 'flex', gap: 8 }} />
            <button onClick={onClose} style={{ marginLeft: 16 }}>结束视频</button>
        </div>
    );
};
