import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Attachment } from '../models/attachment.model';
import { Note } from '../models/note.model';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { unlink } from 'fs/promises';
import type { Express } from 'express';

const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class AttachmentsService {
    constructor(
        @InjectModel(Attachment) private attachmentModel: typeof Attachment,
        @InjectModel(Note) private noteModel: typeof Note,
    ) {}

    async findAllByNote(userId: number, noteId: number): Promise<Attachment[]> {
        const note = await this.noteModel.findOne({ where: { id: noteId, userId } });
        if (!note) {
            throw new NotFoundException(`Note with id ${noteId} not found`);
        }
        return this.attachmentModel.findAll({ where: { noteId } });
    }

    async findOne(userId: number, id: number): Promise<Attachment> {
        const attachment = await this.attachmentModel.findByPk(id, {
            include: [Note],
        });
        if (!attachment || (attachment.note && attachment.note.userId !== userId)) {
            throw new NotFoundException(`Attachment with id ${id} not found`);
        }
        return attachment;
    }

    async uploadFile(userId: number, noteId: number, file: Express.Multer.File): Promise<Attachment> {
        const note = await this.noteModel.findOne({ where: { id: noteId, userId } });
        if (!note) {
            throw new NotFoundException(`Note with id ${noteId} not found`);
        }

        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const ext = path.extname(originalName);
        const displayName = originalName;
        const filepath = file.path;

        const attachment = await this.attachmentModel.create({
            noteId,
            filename: displayName,
            filepath: filepath,
            mimetype: file.mimetype,
            size: file.size,
            extension: ext.substring(1).toLowerCase(),
        } as any);

        return attachment;
    }

    async remove(userId: number, id: number): Promise<void> {
        const attachment = await this.findOne(userId, id);

        try {
            if (fs.existsSync(attachment.filepath)) {
                await unlinkAsync(attachment.filepath);
            }
        } catch (error) {
            console.error('Failed to delete physical file:', error);
        }

        await attachment.destroy();
    }

    async getFilePath(userId: number, id: number): Promise<string> {
        const attachment = await this.findOne(userId, id);
        if (!fs.existsSync(attachment.filepath)) {
            throw new NotFoundException('File not found on disk');
        }
        return attachment.filepath;
    }
}