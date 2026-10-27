import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Task } from '../models/task.model';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import {Subtask} from "../models/subtask.model";
import {Notification} from "../models/notification.model";

@Module({
  imports: [SequelizeModule.forFeature([Task, Subtask, Notification])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}