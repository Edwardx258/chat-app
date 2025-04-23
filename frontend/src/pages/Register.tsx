// frontend/src/pages/Register.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (password !== confirm) {
            setError('两次输入的密码不一致');
            return;
        }
        try {
            await api.register(username, password);
            // 注册成功，跳转到登录页
            navigate('/login', { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || '注册失败，请重试');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '60px auto', padding: 20, border: '1px solid #ccc' }}>
            <h2 style={{ textAlign: 'center' }}>新用户注册</h2>
            {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>用户名</label>
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: 8 }}
                    />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>密码</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: 8 }}
                    />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>确认密码</label>
                    <input
                        type="password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        required
                        style={{ width: '100%', padding: 8 }}
                    />
                </div>
                <button
                    type="submit"
                    style={{ width: '100%', padding: 10, backgroundColor: '#1890ff', color: '#fff', border: 'none' }}
                >
                    注册
                </button>
            </form>
            <div style={{ marginTop: 12, textAlign: 'center' }}>
                已有账号？<Link to="/login">去登录</Link>
            </div>
        </div>
    );
};

export default Register;
