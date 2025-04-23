// backend/src/chat.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'fallback_secret',
            signOptions: { expiresIn: '1h' },
        }),
    ],
    providers: [ChatGateway, ChatService],
    exports: [ChatService],
})
export class ChatModule {}
