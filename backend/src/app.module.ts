import { Module } from '@nestjs/common';
import { ChatModule } from './chat.module';
import { UploadController } from './upload.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    // 将 ./uploads 目录映射到 /uploads 路径
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ChatModule,
  ],
  controllers: [UploadController],
})
export class AppModule {}
