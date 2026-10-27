import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notebook } from '../models/notebook.model';
import { CreateNotebookDto } from './dto/create-notebook.dto';
import { UpdateNotebookDto } from './dto/update-notebook.dto';

@Injectable()
export class NotebooksService {
  constructor(@InjectModel(Notebook) private notebookModel: typeof Notebook) {}

  findAll(userId: number): Promise<Notebook[]> {
    return this.notebookModel.findAll({ where: { userId } });
  }

  async findOne(userId: number, id: number): Promise<Notebook> {
    const notebook = await this.notebookModel.findOne({ where: { id, userId } });
    if (!notebook) {
      throw new NotFoundException(`Notebook with id ${id} not found`);
    }
    return notebook;
  }

  create(userId: number, dto: CreateNotebookDto): Promise<Notebook> {
    return this.notebookModel.create({ ...dto, userId } as any);
  }

  async update(userId: number, id: number, dto: UpdateNotebookDto): Promise<Notebook> {
    const notebook = await this.findOne(userId, id);
    await notebook.update(dto);
    return notebook;
  }

  async remove(userId: number, id: number): Promise<void> {
    const notebook = await this.findOne(userId, id);
    await notebook.destroy();
  }
}