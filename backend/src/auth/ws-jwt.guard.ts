// backend/src/auth/ws-jwt.guard.ts

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { promisify } from 'util';

// ⚠️ 将 jwks-rsa 用 require 导入，避免 default 导入失败
const jwksClient = require('jwks-rsa');

@Injectable()
export class WsJwtGuard implements CanActivate {
    private client: any;
    private getSigningKeyAsync: (kid: string) => Promise<any>;

    constructor() {
        // 初始化 JWKS 客户端
        this.client = jwksClient({
            jwksUri: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
        });
        // 把 callback 版的 getSigningKey 包装成 Promise
        this.getSigningKeyAsync = promisify(this.client.getSigningKey).bind(this.client);
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const socket: any = context.switchToWs().getClient();
        const token: string | undefined = socket.handshake.auth.token;
        if (!token) {
            throw new UnauthorizedException('未提供 token');
        }

        // 解码拿 kid
        const decoded: any = jwt.decode(token, { complete: true });
        if (!decoded?.header?.kid) {
            throw new UnauthorizedException('Token 无效');
        }

        // 异步获取公钥
        let key: any;
        try {
            key = await this.getSigningKeyAsync(decoded.header.kid);
        } catch {
            throw new UnauthorizedException('获取 JWKS 公钥失败');
        }
        const pub = key.getPublicKey();

        // 验证 JWT
        try {
            const payload: any = jwt.verify(token, pub, {
                audience: process.env.COGNITO_APP_CLIENT_ID,
                issuer: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
                algorithms: ['RS256'],
            });
            // 将用户名等信息挂到 socket.data 里
            socket.data.user = {
                username: payload['cognito:username'],
                sub: payload.sub,
            };
            return true;
        } catch {
            throw new UnauthorizedException('Token 验证失败');
        }
    }
}
