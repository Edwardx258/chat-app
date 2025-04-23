// frontend/src/components/VideoChat.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { SignalPayload } from '../services/socket';

interface VideoChatProps {
    room: string;
    user: string;
    socket: Socket;
}

interface Peer {
    id: string;
    user: string;
}

export const VideoChat: React.FC<VideoChatProps> = ({ room, user, socket }) => {
    const localRef = useRef<HTMLVideoElement>(null);
    const remoteRef = useRef<HTMLDivElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
    const [peers, setPeers] = useState<Peer[]>([]);

    useEffect(() => {
        let mounted = true;

        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                if (!mounted) return;
                localStreamRef.current = stream;
                if (localRef.current) {
                    localRef.current.srcObject = stream;
                }

                socket.connect();

                // 信令打印
                socket.onAny((e, p) => console.log('[Signal]', e, p));

                socket.on('existing-users', ({ members }) => {
                    const mapped = members.map((m: any) => ({
                        id: m.senderId,
                        user: m.user,
                    }));
                    mounted && setPeers(mapped);
                });

                socket.on('user-joined', ({ senderId, user: u }) => {
                    if (mounted && senderId !== socket.id) {
                        setPeers((prev) => [...prev, { id: senderId, user: u }]);
                    }
                });

                socket.on('user-left', ({ senderId }: { senderId: string }) => {
                    if (!mounted) return;
                    pcsRef.current[senderId]?.close();
                    delete pcsRef.current[senderId];
                    setPeers((prev) => prev.filter((p) => p.id !== senderId));
                    if (remoteRef.current) {
                        // 停掉远端流
                        Array.from(remoteRef.current.children).forEach((wrapper) => {
                            const vid = (wrapper as HTMLElement).querySelector('video');
                            if (vid) {
                                (vid as HTMLVideoElement).pause();
                                (vid as HTMLVideoElement).srcObject = null;
                            }
                        });
                        remoteRef.current.innerHTML = '';
                    }
                });

                socket.on('video-offer', async (pl: SignalPayload) => {
                    const { senderId, offer } = pl;
                    const ls = localStreamRef.current!;
                    if (!pcsRef.current[senderId]) {
                        await createPC(senderId, ls, false);
                    }
                    const pc = pcsRef.current[senderId]!;
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

                socket.on('video-answer', async (pl: SignalPayload) => {
                    const pc = pcsRef.current[pl.senderId];
                    if (pc && pc.signalingState === 'have-local-offer') {
                        await pc.setRemoteDescription(
                            new RTCSessionDescription(pl.answer!)
                        );
                    }
                });

                socket.on('ice-candidate', async (pl: SignalPayload) => {
                    const pc = pcsRef.current[pl.senderId];
                    if (pc) {
                        await pc.addIceCandidate(new RTCIceCandidate(pl.candidate!));
                    }
                });

                socket.emit('joinRoom', { room, user });
            })
            .catch(console.error);

        return () => {
            mounted = false;

            // 离开房间并断开信令
            socket.emit('leaveRoom', { room });
            socket.removeAllListeners();
            socket.disconnect();

            // 关闭所有 RTCPeerConnection
            Object.values(pcsRef.current).forEach((pc) => pc.close());

            // 停止并释放本地媒体
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => t.stop());
            }
            if (localRef.current) {
                localRef.current.pause();
                localRef.current.srcObject = null;
            }

            // 清空远端视频
            if (remoteRef.current) {
                Array.from(remoteRef.current.children).forEach((wrapper) => {
                    const vid = (wrapper as HTMLElement).querySelector('video');
                    if (vid) {
                        (vid as HTMLVideoElement).pause();
                        (vid as HTMLVideoElement).srcObject = null;
                    }
                });
                remoteRef.current.innerHTML = '';
            }
        };
    }, [room, user, socket]);

    useEffect(() => {
        const ls = localStreamRef.current;
        if (!ls) return;
        const selfId = socket.id ?? '';
        peers.forEach((peer) => {
            if (peer.id !== selfId && !pcsRef.current[peer.id]) {
                const offerer = selfId < peer.id;
                createPC(peer.id, ls, offerer);
            }
        });
    }, [peers, socket]);

    const createPC = async (
        peerId: string,
        ls: MediaStream,
        offerer: boolean
    ) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcsRef.current[peerId] = pc;

        ls.getTracks().forEach((t) => pc.addTrack(t, ls));

        pc.ontrack = (e) => {
            const [stream] = e.streams;
            let w = document.getElementById(`wrapper-${peerId}`);
            if (!w && remoteRef.current) {
                w = document.createElement('div');
                w.id = `wrapper-${peerId}`;
                w.style.marginRight = '8px';

                const vid = document.createElement('video');
                vid.id = `video-${peerId}`;
                vid.autoplay = true;
                vid.style.width = '240px';
                vid.style.height = '180px';
                w.appendChild(vid);

                const lbl = document.createElement('div');
                lbl.innerText = peers.find((p) => p.id === peerId)?.user || '未知';
                lbl.style.textAlign = 'center';
                lbl.style.marginTop = '4px';
                w.appendChild(lbl);

                remoteRef.current.appendChild(w);
            }
            const vidEl = document.getElementById(`video-${peerId}`) as HTMLVideoElement;
            if (vidEl) vidEl.srcObject = stream;
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
        <div style={{ display: 'flex', padding: 16, alignItems: 'flex-start' }}>
            <div style={{ marginRight: 16 }}>
                <video ref={localRef} autoPlay muted style={{ width: 240, height: 180 }} />
                <div style={{ textAlign: 'center', marginTop: 4 }}>{user} (me)</div>
            </div>
            <div ref={remoteRef} style={{ display: 'flex', gap: 8 }} />
        </div>
    );
};
