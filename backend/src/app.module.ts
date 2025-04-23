// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import 'dotenv/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';  // 用户实体
import { UserRepository } from './users/user.repository';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat.module';

@Module({
  imports: [
    // ← 注册全局 DataSource
    TypeOrmModule.forRoot({
      type: 'postgres',               // 或你用的数据库类型
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [User],
      synchronize: true,              // 开发时可用，生产慎用
    }),

    // ← 把 Repository 注册到依赖注入容器
    TypeOrmModule.forFeature([UserRepository]),
    AuthModule,
    ChatModule,
  ],
})
export class AppModule {}
