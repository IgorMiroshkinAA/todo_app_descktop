import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Subtask } from '../models/subtask.model';
import { Task } from '../models/task.model';
import { SubtasksController } from './subtasks.controller';
import { SubtasksService } from './subtasks.service';

@Module({
    imports: [SequelizeModule.forFeature([Subtask, Task])],
    controllers: [SubtasksController],
    providers: [SubtasksService],
})
export class SubtasksModule {}