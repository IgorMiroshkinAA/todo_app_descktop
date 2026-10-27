import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Notebook } from '../models/notebook.model';
import { NotebooksController } from './notebooks.controller';
import { NotebooksService } from './notebooks.service';

@Module({
  imports: [SequelizeModule.forFeature([Notebook])],
  controllers: [NotebooksController],
  providers: [NotebooksService],
})
export class NotebooksModule {}