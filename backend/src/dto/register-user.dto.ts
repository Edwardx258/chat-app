// backend/src/auth/dto/register-user.dto.ts
import { IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterUserDto {
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    username: string;

    @IsString()
    @MinLength(6)
    @MaxLength(32)
    password: string;
}
