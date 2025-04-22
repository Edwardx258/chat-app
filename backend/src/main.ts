import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 启用 WebSocket
  app.enableCors({ origin: true, credentials: true });
  // 监听所有网卡
  await app.listen(3000, '0.0.0.0');
  console.log('Server listening on http://0.0.0.0:3001');
}
bootstrap();
