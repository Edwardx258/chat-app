// backend/src/upload.controller.ts
import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Controller('upload')
export class UploadController {
    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (_req, file, cb) => {
                    // 用 uuid + 原始扩展名，避免同名冲突
                    const fn = `${uuidv4()}${extname(file.originalname)}`;
                    cb(null, fn);
                },
            }),
            limits: { fileSize: 20 * 1024 * 1024 }, // 最大 20MB，根据需求调整
        }) as any, // TS mixin 类型断言
    )
    upload(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new HttpException('Upload failed', HttpStatus.BAD_REQUEST);
        }
        // 返回前端可访问的 URL 和原文件名
        return {
            fileUrl: `/uploads/${file.filename}`,
            fileName: file.originalname,
        };
    }
}
