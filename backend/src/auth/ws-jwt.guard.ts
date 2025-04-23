import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import jwksClient, { JwksClient, SigningKey } from 'jwks-rsa';
import { promisify } from 'util';

@Injectable()
export class WsJwtGuard implements CanActivate {
    private client: JwksClient;
    private getSigningKey: (kid: string) => Promise<SigningKey>;

    constructor() {
        this.client = jwksClient({
            jwksUri: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
        });
        this.getSigningKey = promisify(this.client.getSigningKey).bind(this.client);
    }

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const sock: any = ctx.switchToWs().getClient();
        const token = sock.handshake.auth.token;
        if (!token) throw new UnauthorizedException('未提供 token');

        const decoded: any = jwt.decode(token, { complete: true });
        if (!decoded?.header?.kid) throw new UnauthorizedException('Token 无效');

        const key = await this.getSigningKey(decoded.header.kid);
        const pub = key.getPublicKey();

        try {
            const payload: any = jwt.verify(token, pub, {
                audience: process.env.COGNITO_APP_CLIENT_ID,
                issuer: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
                algorithms: ['RS256'],
            });
            // 保存用户名到 socket.data
            sock.data.user = { username: payload['cognito:username'], sub: payload.sub };
            return true;
        } catch {
            throw new UnauthorizedException('Token 验证失败');
        }
    }
}
