import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Note } from '../models/note.model';
import { Notebook } from '../models/notebook.model';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import {Attachment} from "../models/attachment.model";

@Module({
  imports: [SequelizeModule.forFeature([Note, Notebook, Attachment])],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}