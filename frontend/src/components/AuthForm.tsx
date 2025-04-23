// frontend/src/components/AuthForm.tsx

import React, { useState } from 'react';
import { Input, Button, message, Card, Typography } from 'antd';
import { signUp, confirmSignUp, signIn } from '../services/cognito';


const { Title } = Typography;

export const AuthForm: React.FC<{ onLogin(token: string): void }> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState<'signIn' | 'signUp' | 'confirm'>('signIn');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!username || !password) {
            console.log('empty fields');
            message.warning('用户名和密码不能为空');
            return;
        }
        setLoading(true);
        try {
            await signUp(username, password);
            message.success('注册成功，验证码已发到邮箱，请输入确认码');
            setStep('confirm');
        } catch (e: any) {
            message.error(e.message || '注册失败');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!code) {
            message.warning('请输入验证码');
            return;
        }
        setLoading(true);
        try {
            await confirmSignUp(username, code);
            message.success('确认成功，请登录');
            setStep('signIn');
        } catch (e: any) {
            message.error(e.message || '确认失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async () => {
        if (!username || !password) {
            message.warning('用户名和密码不能为空');
            return;
        }
        setLoading(true);
        try {
            const token = await signIn(username, password);
            onLogin(token);
        } catch (e: any) {
            message.error(e.message || '登录失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card style={{ maxWidth: 400, margin: '100px auto', textAlign: 'center' }}>
            <Title level={3}>QuickChat</Title>

            {(step === 'signIn' || step === 'signUp') && (
                <>
                    <Input
                        placeholder="Email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ marginBottom: 12 }}
                    />
                    <Input.Password
                        placeholder="Password(at least 8 digits)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ marginBottom: 12 }}
                    />
                </>
            )}

            {step === 'confirm' && (
                <Input
                    placeholder="Please enter verification code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    style={{ marginBottom: 12 }}
                />
            )}

            <div>
                {step === 'signIn' && (
                    <>
                        <Button
                            type="primary"
                            onClick={handleSignIn}
                            loading={loading}
                            style={{ width: 120, marginRight: 8 }}
                        >
                            Login
                        </Button>
                        <Button onClick={() => setStep('signUp')} style={{ width: 120 }}>
                            Register
                        </Button>
                    </>
                )}
                {step === 'signUp' && (
                    <>
                        <Button
                            type="primary"
                            onClick={handleSignUp}
                            loading={loading}
                            style={{ width: 120, marginRight: 8 }}
                        >
                            Register
                        </Button>
                        <Button onClick={() => setStep('signIn')} style={{ width: 120 }}>
                            Back to Login
                        </Button>
                    </>
                )}
                {step === 'confirm' && (
                    <>
                        <Button
                            type="primary"
                            onClick={handleConfirm}
                            loading={loading}
                            style={{ width: 120, marginRight: 8 }}
                        >
                            Confirm
                        </Button>
                    </>
                )}
            </div>
        </Card>
    );
};
