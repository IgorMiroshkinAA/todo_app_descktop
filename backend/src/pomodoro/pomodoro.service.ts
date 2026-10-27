import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { PomodoroSession } from '../models/pomodoro-session.model';
import { Task } from '../models/task.model';
import { StartPomodoroDto } from './dto/pomodoro.dto';

@Injectable()
export class PomodoroService {
    constructor(
        @InjectModel(PomodoroSession) private pomodoroModel: typeof PomodoroSession,
        @InjectModel(Task) private taskModel: typeof Task,
    ) {}

    async getSessionsByTask(userId: number, taskId: number): Promise<PomodoroSession[]> {
        const task = await this.taskModel.findOne({ where: { id: taskId, userId } });
        if (!task) {
            throw new NotFoundException(`Task with id ${taskId} not found`);
        }

        return this.pomodoroModel.findAll({
            where: { taskId },
            order: [['createdAt', 'DESC']],
        });
    }

    async getStatsByTask(userId: number, taskId: number) {
        const task = await this.taskModel.findOne({ where: { id: taskId, userId } });
        if (!task) {
            throw new NotFoundException(`Task with id ${taskId} not found`);
        }

        const sessions = await this.pomodoroModel.findAll({ where: { taskId } });

        const workSessions = sessions.filter((s) => s.type === 'work');
        const completedWorkSessions = workSessions.filter((s) => s.completed);
        const totalMinutes = completedWorkSessions.reduce((sum, s) => sum + s.duration, 0);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todaySessions = workSessions.filter((s) => {
            const date = new Date(s.createdAt);
            return date >= todayStart && date <= todayEnd;
        });
        const todayMinutes = todaySessions.reduce(
            (sum, s) => sum + (s.completed ? s.duration : 0),
            0,
        );

        return {
            totalSessions: sessions.length,
            totalMinutes,
            completedWorkSessions: completedWorkSessions.length,
            todaySessions: todaySessions.length,
            todayMinutes,
        };
    }

    async startSession(userId: number, taskId: number, dto: StartPomodoroDto): Promise<PomodoroSession> {
        const task = await this.taskModel.findOne({ where: { id: taskId, userId } });
        if (!task) {
            throw new NotFoundException(`Task with id ${taskId} not found`);
        }

        return this.pomodoroModel.create({
            taskId,
            startedAt: new Date(),
            duration: dto.duration || 25,
            type: dto.type || 'work',
            completed: false,
        } as any);
    }

    async stopSession(userId: number, sessionId: number, completed: boolean = true): Promise<PomodoroSession> {
        const session = await this.pomodoroModel.findByPk(sessionId, {
            include: [Task],
        });

        if (!session || (session.task && session.task.userId !== userId)) {
            throw new NotFoundException(`Session with id ${sessionId} not found`);
        }

        await session.update({
            endedAt: new Date(),
            completed,
        });

        return session;
    }
}