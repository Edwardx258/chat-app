// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ChatModule } from './chat.module';
import { UploadController } from './upload.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    // 把本地 uploads/ 目录映射到 /uploads 路径，静态服务
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ChatModule,
  ],
  controllers: [UploadController],
})
export class AppModule {}
