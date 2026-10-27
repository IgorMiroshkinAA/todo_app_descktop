import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification } from '../models/notification.model';
import { Task } from '../models/task.model';
import { Event } from '../models/event.model';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification) private notificationModel: typeof Notification,
        @InjectModel(Task) private taskModel: typeof Task,
        @InjectModel(Event) private eventModel: typeof Event,
    ) {}

    async findAll(userId: number): Promise<Notification[]> {
        return this.notificationModel.findAll({
            include: [
                { model: Task, attributes: ['id', 'title'], required: false },
                { model: Event, attributes: ['id', 'title'], required: false },
            ],
            where: {
                [Op.or]: [
                    { '$task.userId$': userId },
                    { '$event.userId$': userId },
                ],
            },
            order: [['createdAt', 'DESC']],
        });
    }

    async findUnread(userId: number): Promise<Notification[]> {
        return this.notificationModel.findAll({
            include: [
                { model: Task, attributes: ['id', 'title'], required: false },
                { model: Event, attributes: ['id', 'title'], required: false },
            ],
            where: {
                read: false,
                [Op.or]: [
                    { '$task.userId$': userId },
                    { '$event.userId$': userId },
                ],
            },
            order: [['createdAt', 'DESC']],
        });
    }

    async markAsRead(userId: number, id: number): Promise<Notification> {
        const notification = await this.notificationModel.findByPk(id, {
            include: [
                { model: Task, required: false },
                { model: Event, required: false },
            ],
        });

        if (!notification) {
            throw new NotFoundException(`Notification with id ${id} not found`);
        }

        // Проверка прав
        const taskUserId = (notification as any).task?.userId;
        const eventUserId = (notification as any).event?.userId;
        if (taskUserId !== userId && eventUserId !== userId) {
            throw new NotFoundException(`Notification with id ${id} not found`);
        }

        await notification.update({ read: true });
        return notification;
    }

    async markAllAsRead(userId: number): Promise<{ count: number }> {
        const notifications = await this.notificationModel.findAll({
            include: [
                { model: Task, required: false },
                { model: Event, required: false },
            ],
            where: {
                read: false,
                [Op.or]: [
                    { '$task.userId$': userId },
                    { '$event.userId$': userId },
                ],
            },
        });

        for (const n of notifications) {
            await n.update({ read: true });
        }

        return { count: notifications.length };
    }

    async remove(userId: number, id: number): Promise<void> {
        const notification = await this.notificationModel.findByPk(id, {
            include: [
                { model: Task, required: false },
                { model: Event, required: false },
            ],
        });

        if (!notification) {
            throw new NotFoundException(`Notification with id ${id} not found`);
        }

        const taskUserId = (notification as any).task?.userId;
        const eventUserId = (notification as any).event?.userId;
        if (taskUserId !== userId && eventUserId !== userId) {
            throw new NotFoundException(`Notification with id ${id} not found`);
        }

        await notification.destroy();
    }

    // ============ CRON: ПРОСРОЧЕННЫЕ ЗАДАЧИ ============
    @Cron(CronExpression.EVERY_HOUR)
    async checkOverdueTasks() {
        console.log('🔍 Checking overdue tasks...');
        const now = new Date();
        const overdueTasks = await this.taskModel.findAll({
            where: {
                dueDate: { [Op.lt]: now },
                completed: false,
            },
        });

        for (const task of overdueTasks) {
            const taskTitle = task.title || 'Без названия';
            const message = `Задача "${taskTitle}" просрочена!`;
            await this.createNotificationIfNotExists(task.id, 'overdue', message);
        }
    }

    // ============ CRON: ПРИБЛИЖАЮЩИЕСЯ ЗАДАЧИ ============
    @Cron(CronExpression.EVERY_HOUR)
    async checkUpcomingTasks() {
        console.log('🔍 Checking upcoming tasks...');
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const upcomingTasks = await this.taskModel.findAll({
            where: {
                dueDate: { [Op.between]: [now, in24Hours] },
                completed: false,
            },
        });

        for (const task of upcomingTasks) {
            const taskTitle = task.title || 'Без названия';
            const message = `Задача "${taskTitle}" должна быть выполнена в ближайшие 24 часа`;
            await this.createNotificationIfNotExists(task.id, 'upcoming', message);
        }
    }

    // ============ CRON: ВСТРЕЧИ ЗА 15 МИНУТ ============
    @Cron(CronExpression.EVERY_MINUTE)
    async checkUpcomingEvents() {
        const now = new Date();
        const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
        const in16Minutes = new Date(now.getTime() + 16 * 60 * 1000);

        const upcomingEvents = await this.eventModel.findAll({
            where: {
                startTime: { [Op.between]: [in15Minutes, in16Minutes] },
            },
        });

        for (const event of upcomingEvents) {
            const existing = await this.notificationModel.findOne({
                where: { eventId: event.id, type: 'event_soon' },
            });

            if (!existing) {
                const timeStr = new Date(event.startTime).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                });
                const message = `Встреча "${event.title}" начнётся в ${timeStr} (через 15 минут)`;

                await this.notificationModel.create({
                    eventId: event.id,
                    taskId: null,
                    type: 'event_soon',
                    message,
                    read: false,
                } as any);

                console.log(`✅ Event notification created: ${message}`);
            }
        }
    }

    private async createNotificationIfNotExists(
        taskId: number,
        type: 'overdue' | 'upcoming',
        message: string,
    ): Promise<void> {
        // Проверяем наличие ЛЮБОГО уведомления для задачи и типа
        // БЕЗ условия read: false — чтобы не создавать повторно после прочтения
        const existing = await this.notificationModel.findOne({
            where: { taskId, type },
        });

        if (!existing) {
            await this.notificationModel.create({
                taskId,
                eventId: null,
                type,
                message,
                read: false,
            } as any);
            console.log(`✅ Notification created: ${message}`);
        } else {
            console.log(`⏭️ Notification already exists for task ${taskId}, type ${type}`);
        }
    }
}