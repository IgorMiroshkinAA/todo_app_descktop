import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Task } from '../models/task.model';
import { Subtask } from '../models/subtask.model';
import { Notification } from '../models/notification.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
      @InjectModel(Task) private taskModel: typeof Task,
      @InjectModel(Subtask) private subtaskModel: typeof Subtask,
      @InjectModel(Notification) private notificationModel: typeof Notification,
  ) {}

  async findAll(userId: number, query: any): Promise<Task[]> {
    const where: any = { userId };

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;

    if (query.dateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      switch (query.dateFilter) {
        case 'today':
          where.dueDate = {
            [Op.between]: [
              today,
              new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
            ],
          };
          break;
        case 'tomorrow': {
          const tomorrowEnd = new Date(tomorrow);
          tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
          where.dueDate = { [Op.between]: [tomorrow, tomorrowEnd] };
          break;
        }
        case 'overdue':
          where.dueDate = { [Op.lt]: today };
          where.completed = false;
          break;
      }
    }

    if (query.search) {
      where.title = { [Op.like]: `%${query.search}%` };
    }

    return this.taskModel.findAll({
      where,
      order: [['dueDate', 'ASC']],
    });
  }

  async findOne(userId: number, id: number): Promise<Task> {
    const task = await this.taskModel.findOne({ where: { id, userId } });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  async create(userId: number, dto: CreateTaskDto): Promise<Task> {
    const completed = dto.status === 'done';
    return this.taskModel.create({
      ...dto,
      userId,
      completed,
    } as any);
  }

  async update(userId: number, id: number, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(userId, id);

    // Синхронизируем completed и status
    if (dto.status !== undefined && dto.completed === undefined) {
      dto.completed = dto.status === 'done';
    }
    if (dto.completed !== undefined && dto.status === undefined) {
      dto.status = dto.completed ? 'done' : 'todo';
    }

    await task.update(dto as any);

    // Уведомления — сбрасываем при изменениях
    if (
        dto.dueDate !== undefined ||
        dto.status !== undefined ||
        dto.completed !== undefined
    ) {
      await this.notificationModel.destroy({
        where: {
          taskId: id,
          type: { [Op.in]: ['overdue', 'upcoming'] },
        },
      });
    }

    return task;
  }

  async remove(userId: number, id: number): Promise<void> {
    await this.findOne(userId, id);
    await this.notificationModel.destroy({ where: { taskId: id } });
    await this.subtaskModel.destroy({ where: { taskId: id } });
    await this.taskModel.destroy({ where: { id } });
  }

  async getTasksForCalendar(userId: number, startDate: string, endDate: string): Promise<Task[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return this.taskModel.findAll({
      where: {
        userId,
        dueDate: { [Op.between]: [start, end] },
      },
      order: [['dueDate', 'ASC']],
    });
  }

  async moveTaskToDate(userId: number, taskId: number, newDate: string): Promise<Task> {
    const task = await this.findOne(userId, taskId);
    const dueDate = new Date(newDate);
    await task.update({ dueDate });
    return task;
  }

  async exportTasks(userId: number): Promise<Task[]> {
    return this.taskModel.findAll({
      where: { userId },
      include: [Subtask],
      order: [['createdAt', 'DESC']],
    });
  }

  async importTasks(userId: number, tasksData: any[]): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    for (const taskData of tasksData) {
      try {
        if (!taskData.title) {
          skipped++;
          continue;
        }

        await this.taskModel.create({
          title: taskData.title,
          description: taskData.description || null,
          dueDate: taskData.dueDate || null,
          completed: taskData.completed || false,
          priority: taskData.priority || 'medium',
          status: taskData.status || 'todo',
          userId,
        } as any);
        imported++;
      } catch (error) {
        console.error('Failed to import task:', taskData, error);
        skipped++;
      }
    }

    return { imported, skipped };
  }
}