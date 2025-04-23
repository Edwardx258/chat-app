// frontend/src/components/AuthForm.tsx

import React, { useState } from 'react';
import { Input, Button, Card, Typography, message } from 'antd';
import { signUp, confirmSignUp, signIn } from '../services/cognito';

const { Title } = Typography;

interface AuthFormProps {
    onLogin(token: string): void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
    // AntD message hook
    const [messageApi, contextHolder] = message.useMessage();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState<'signIn' | 'signUp' | 'confirm'>('signIn');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!username || !password) {
            messageApi.warning('Username and password cannot be empty');
            return;
        }
        setLoading(true);
        try {
            await signUp(username, password);
            messageApi.success('Register Success');
            setStep('confirm');
        } catch (e: any) {
            messageApi.error(e.message || 'Register Fail');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!code) {
            messageApi.warning('Please enter the verification code');
            return;
        }
        setLoading(true);
        try {
            await confirmSignUp(username, code);
            messageApi.success('Confirm Success');
            setStep('signIn');
        } catch (e: any) {
            messageApi.error(e.message || 'Confirm Fail');
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async () => {
        if (!username || !password) {
            messageApi.warning('Username and password cannot be empty');
            return;
        }
        setLoading(true);
        try {
            const token = await signIn(username, password);
            messageApi.success('Login Success');
            onLogin(token);
        } catch (e: any) {
            messageApi.error(e.message || 'Login Fail');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
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
                        <Button
                            type="primary"
                            onClick={handleConfirm}
                            loading={loading}
                            style={{ width: 120 }}
                        >
                            Confirm
                        </Button>
                    )}
                </div>
            </Card>
        </>
    );
};
