// backend/src/auth/guards/local-auth.guard.ts

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 使用 Passport 的 'local' 策略来进行路由守卫
 * 在 AuthModule 里注册了 PassportModule.register({ defaultStrategy: 'local' })
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
