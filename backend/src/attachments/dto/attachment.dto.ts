import type { Express } from 'express'; // <-- добавьте import type

export class AttachmentDto {
    id: number;
    filename: string;
    filepath: string;
    mimetype: string;
    size: number;
    extension: string;
    noteId: number;
    createdAt: Date;
    updatedAt: Date;
}

export class UploadFileDto {
    noteId: number;
    file: Express.Multer.File;
}