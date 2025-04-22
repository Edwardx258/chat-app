// backend/src/upload.controller.ts
import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    HttpException,
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
                    const name = uuidv4() + extname(file.originalname);
                    cb(null, name);
                },
            }),
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype.match(/^image\/(jpeg|png|gif)$/)) {
                    return cb(new HttpException('只允许 JPEG/PNG/GIF 格式', 400), false);
                }
                cb(null, true);
            },
            limits: { fileSize: 5 * 1024 * 1024 }, // 最大 5MB
        }) as any,
    )
    upload(@UploadedFile() file: Express.Multer.File) {
        // 返回给前端的访问路径
        return { imageUrl: `/uploads/${file.filename}` };
    }
}
