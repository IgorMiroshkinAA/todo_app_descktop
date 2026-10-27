import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import * as fs from 'fs';
import { promisify } from 'util';
import { Note } from '../models/note.model';
import { Notebook } from '../models/notebook.model';
import { Attachment } from '../models/attachment.model';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class NotesService {
  constructor(
      @InjectModel(Note) private noteModel: typeof Note,
      @InjectModel(Notebook) private notebookModel: typeof Notebook,
      @InjectModel(Attachment) private attachmentModel: typeof Attachment,
  ) {}

  async findAll(userId: number, query: any): Promise<Note[]> {
    const where: any = { userId };

    if (query.search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${query.search}%` } },
        { content: { [Op.like]: `%${query.search}%` } },
      ];
    }

    const order: any = [];
    if (query.sortBy) {
      const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
      order.push([query.sortBy, sortOrder]);
    } else {
      order.push(['createdAt', 'DESC']);
    }

    return this.noteModel.findAll({
      where,
      order,
      include: [Attachment],
    });
  }

  async findAllByNotebook(userId: number, notebookId: number, query: any): Promise<Note[]> {
    const notebook = await this.notebookModel.findOne({
      where: { id: notebookId, userId },
    });
    if (!notebook) {
      throw new NotFoundException(`Notebook with id ${notebookId} not found`);
    }

    const where: any = { notebookId, userId };

    if (query.search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${query.search}%` } },
        { content: { [Op.like]: `%${query.search}%` } },
      ];
    }

    const order: any = [];
    if (query.sortBy) {
      const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
      order.push([query.sortBy, sortOrder]);
    } else {
      order.push(['createdAt', 'DESC']);
    }

    return this.noteModel.findAll({
      where,
      order,
      include: [Attachment],
    });
  }

  async findOne(userId: number, id: number): Promise<Note> {
    const note = await this.noteModel.findOne({
      where: { id, userId },
      include: [Attachment],
    });
    if (!note) {
      throw new NotFoundException(`Note with id ${id} not found`);
    }
    return note;
  }

  async create(userId: number, notebookId: number, dto: CreateNoteDto): Promise<Note> {
    const notebook = await this.notebookModel.findOne({
      where: { id: notebookId, userId },
    });
    if (!notebook) {
      throw new NotFoundException(`Notebook with id ${notebookId} not found`);
    }
    return this.noteModel.create({ ...dto, notebookId, userId } as any);
  }

  async update(userId: number, id: number, dto: UpdateNoteDto): Promise<Note> {
    const note = await this.findOne(userId, id);
    await note.update(dto);
    return note;
  }

  async remove(userId: number, id: number): Promise<void> {
    const note = await this.noteModel.findOne({
      where: { id, userId },
      include: [Attachment],
    });

    if (!note) {
      throw new NotFoundException(`Note with id ${id} not found`);
    }

    if (note.attachments && note.attachments.length > 0) {
      for (const attachment of note.attachments) {
        try {
          if (fs.existsSync(attachment.filepath)) {
            await unlinkAsync(attachment.filepath);
          }
        } catch (error) {
          console.error(`Failed to delete file ${attachment.filepath}:`, error);
        }
      }
      await this.attachmentModel.destroy({ where: { noteId: id } });
    }

    await note.destroy();
  }

  async exportNotes(userId: number): Promise<Note[]> {
    return this.noteModel.findAll({
      where: { userId },
      include: [Attachment],
      order: [['createdAt', 'DESC']],
    });
  }

  async importNotes(userId: number, notesData: any[]): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    for (const noteData of notesData) {
      try {
        if (!noteData.title) {
          skipped++;
          continue;
        }

        let notebookId = noteData.notebookId;

        if (notebookId) {
          const notebook = await this.notebookModel.findOne({
            where: { id: notebookId, userId },
          });
          if (!notebook) notebookId = null;
        }

        if (!notebookId) {
          let defaultNotebook = await this.notebookModel.findOne({
            where: { name: 'Импортированные заметки', userId },
          });

          if (!defaultNotebook) {
            defaultNotebook = await this.notebookModel.create({
              name: 'Импортированные заметки',
              description: 'Заметки, импортированные из файла',
              userId,
            } as any);
          }
          notebookId = defaultNotebook.id;
        }

        await this.noteModel.create({
          title: noteData.title,
          content: noteData.content || null,
          notebookId,
          userId,
        } as any);
        imported++;
      } catch (error) {
        console.error('Failed to import note:', noteData, error);
        skipped++;
      }
    }

    return { imported, skipped };
  }
}