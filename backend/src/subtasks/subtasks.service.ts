import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Subtask } from '../models/subtask.model';
import { Task } from '../models/task.model';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';

@Injectable()
export class SubtasksService {
    constructor(
        @InjectModel(Subtask) private subtaskModel: typeof Subtask,
        @InjectModel(Task) private taskModel: typeof Task,
    ) {}

    async findAllByTask(userId: number, taskId: number): Promise<Subtask[]> {
        const task = await this.taskModel.findOne({ where: { id: taskId, userId } });
        if (!task) {
            throw new NotFoundException(`Task with id ${taskId} not found`);
        }
        return this.subtaskModel.findAll({ where: { taskId } });
    }

    async findOne(userId: number, id: number): Promise<Subtask> {
        const subtask = await this.subtaskModel.findByPk(id, {
            include: [Task],
        });
        if (!subtask || (subtask.task && subtask.task.userId !== userId)) {
            throw new NotFoundException(`Subtask with id ${id} not found`);
        }
        return subtask;
    }

    async create(userId: number, taskId: number, dto: CreateSubtaskDto): Promise<Subtask> {
        const task = await this.taskModel.findOne({ where: { id: taskId, userId } });
        if (!task) {
            throw new NotFoundException(`Task with id ${taskId} not found`);
        }
        return this.subtaskModel.create({ ...dto, taskId } as any);
    }

    async update(userId: number, id: number, dto: UpdateSubtaskDto): Promise<Subtask> {
        const subtask = await this.findOne(userId, id);
        await subtask.update(dto);
        return subtask;
    }

    async remove(userId: number, id: number): Promise<void> {
        const subtask = await this.findOne(userId, id);
        await subtask.destroy();
    }
}