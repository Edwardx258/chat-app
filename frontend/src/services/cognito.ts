// frontend/src/services/cognito.ts
import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
    CognitoUserSession,
    CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const poolData = {
    UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID!,
    ClientId: process.env.REACT_APP_COGNITO_APP_CLIENT_ID!,
};
const userPool = new CognitoUserPool(poolData);

/**
 * 注册新用户，强制传入 email 属性
 */
export function signUp(username: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // 这里把 Name 写成 console 里看到的那个属性名，通常是 'email'
        const attributeList = [
            new CognitoUserAttribute({ Name: 'email', Value: username }),
        ];
        userPool.signUp(username, password, attributeList, [], (err, result) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

export function confirmSignUp(username: string, code: string): Promise<void> {
    return new Promise((res, rej) => {
        const user = new CognitoUser({ Username: username, Pool: userPool });
        user.confirmRegistration(code, true, (err) => {
            if (err) return rej(err);
            res();
        });
    });
}

export function signIn(username: string, password: string): Promise<string> {
    return new Promise((res, rej) => {
        const auth = new AuthenticationDetails({ Username: username, Password: password });
        const user = new CognitoUser({ Username: username, Pool: userPool });
        user.authenticateUser(auth, {
            onSuccess: (session: CognitoUserSession) => {
                res(session.getIdToken().getJwtToken());
            },
            onFailure: (err) => rej(err),
            newPasswordRequired: () => rej(new Error('需要新密码')),
            mfaRequired: () => rej(new Error('需要 MFA 验证')),
        });
    });
}
