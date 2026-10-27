import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('notes')
  async findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.notesService.findAll(user.id, query);
  }

  @Get('notes/export')
  async exportNotes(@CurrentUser() user: any) {
    return this.notesService.exportNotes(user.id);
  }

  @Get('notes/export/docx/:id')
  async exportNoteDocx(
      @CurrentUser() user: any,
      @Param('id') id: string,
      @Res() res: Response,
  ) {
    const note = await this.notesService.findOne(user.id, +id);

    // Парсим HTML → параграфы
    const contentParagraphs = this.htmlToParagraphs(note.content || '');

    const doc = new Document({
      creator: user.email || 'Tempo',
      title: note.title,
      description: 'Заметка из Tempo',
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: note.title,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Создано: ${new Date(note.createdAt).toLocaleString('ru-RU')}`,
                  italics: true,
                  color: '888888',
                  size: 20,
                }),
              ],
              spacing: { after: 400 },
            }),
            ...contentParagraphs,
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    const safeFilename = encodeURIComponent(note.title.replace(/[<>:"/\\|?*]/g, '_'));
    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeFilename}.docx"; filename*=UTF-8''${safeFilename}.docx`,
    );
    res.send(buffer);
  }

  // Парсер HTML → параграфы DOCX
  private htmlToParagraphs(html: string): Paragraph[] {
    // Разбиваем на блоки по </p>, <br>, </div>, </h1>, </h2>, </h3>
    const blocks = html
        .replace(/<\/p>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    return blocks.map((block) => {
      // Определяем заголовки
      const isH1 = /<h1/i.test(html) && block.includes('<h1');
      const isH2 = block.includes('<h2');
      const isH3 = block.includes('<h3');
      const isBold = block.includes('<strong>') || block.includes('<b>');
      const isItalic = block.includes('<em>') || block.includes('<i>');

      // Убираем HTML-теги
      const cleanText = block
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();

      if (!cleanText) {
        return new Paragraph({ text: '' });
      }

      // Заголовки
      if (isH2) {
        return new Paragraph({
          text: cleanText,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        });
      }
      if (isH3) {
        return new Paragraph({
          text: cleanText,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 150, after: 100 },
        });
      }

      // Обычный параграф
      return new Paragraph({
        children: [
          new TextRun({
            text: cleanText,
            bold: isBold,
            italics: isItalic,
          }),
        ],
        spacing: { after: 100 },
      });
    });
  }

  @Post('notes/import')
  async importNotes(@CurrentUser() user: any, @Body() notesData: any[]) {
    return this.notesService.importNotes(user.id, notesData);
  }

  @Get('notebooks/:notebookId/notes')
  findAllByNotebook(
      @CurrentUser() user: any,
      @Param('notebookId') notebookId: string,
      @Query() query: any,
  ) {
    return this.notesService.findAllByNotebook(user.id, +notebookId, query);
  }

  @Get('notes/:id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notesService.findOne(user.id, +id);
  }

  @Post('notebooks/:notebookId/notes')
  create(
      @CurrentUser() user: any,
      @Param('notebookId') notebookId: string,
      @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.notesService.create(user.id, +notebookId, createNoteDto);
  }

  @Put('notes/:id')
  update(
      @CurrentUser() user: any,
      @Param('id') id: string,
      @Body() updateNoteDto: UpdateNoteDto,
  ) {
    return this.notesService.update(user.id, +id, updateNoteDto);
  }

  @Delete('notes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notesService.remove(user.id, +id);
  }
}