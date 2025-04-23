// backend/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { ChatModule } from './chat.module';
import { UploadController } from './upload.controller';
import { WsJwtGuard } from './auth/ws-jwt.guard';

@Module({
  imports: [
    // 从根目录加载 .env，注入 process.env
    ConfigModule.forRoot({ isGlobal: true }),

    // 将 backend/uploads 目录作为 /uploads 路径的静态服务
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // 聊天功能模块，包含 ChatGateway、ChatService 等
    ChatModule,
  ],
  controllers: [
    // 处理文件上传接口
    UploadController,
  ],
  providers: [
    // WebSocket JWT 守卫
    WsJwtGuard,
  ],
})
export class AppModule {}
