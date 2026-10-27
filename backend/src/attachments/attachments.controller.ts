import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Res,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AttachmentsService } from './attachments.service';
import { Response } from 'express';
import type { Express } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class AttachmentsController {
    constructor(private readonly attachmentsService: AttachmentsService) {}

    @Get('note/:noteId')
    findAllByNote(@CurrentUser() user: any, @Param('noteId') noteId: string) {
        return this.attachmentsService.findAllByNote(user.id, +noteId);
    }

    @Post('upload/:noteId')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, callback) => {
                    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                    const cleanName = originalName.replace(/[<>:"/\\|?*]/g, '_');
                    const timestamp = Date.now();
                    const random = Math.round(Math.random() * 1e9);
                    const ext = extname(cleanName);
                    const nameWithoutExt = cleanName.substring(0, cleanName.lastIndexOf(ext));
                    const filename = `${nameWithoutExt}_${timestamp}_${random}${ext}`;
                    callback(null, filename);
                },
            }),
            limits: { fileSize: 10 * 1024 * 1024 },
        }),
    )
    async uploadFile(
        @CurrentUser() user: any,
        @Param('noteId') noteId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        return this.attachmentsService.uploadFile(user.id, +noteId, file);
    }

    @Get('download/:id')
    async downloadFile(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Res() res: Response,
    ) {
        const filePath = await this.attachmentsService.getFilePath(user.id, +id);
        const attachment = await this.attachmentsService.findOne(user.id, +id);

        const filename = attachment.filename;
        const encodedFilename = encodeURIComponent(filename);

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
        );
        res.setHeader('Content-Type', attachment.mimetype);

        return res.sendFile(filePath);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@CurrentUser() user: any, @Param('id') id: string) {
        return this.attachmentsService.remove(user.id, +id);
    }
}