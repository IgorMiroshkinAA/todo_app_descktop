import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Event } from '../models/event.model';
import { Notification } from '../models/notification.model'
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
    constructor(
        @InjectModel(Event) private eventModel: typeof Event,
        @InjectModel(Notification) private notificationModel: typeof Notification,
    ) {}

    async findAll(userId: number): Promise<Event[]> {
        return this.eventModel.findAll({
            where: { userId },
            order: [['startTime', 'ASC']],
        });
    }

    async findForCalendar(userId: number, start: string, end: string): Promise<Event[]> {
        const startDate = new Date(start);
        const endDate = new Date(end);

        return this.eventModel.findAll({
            where: {
                userId,
                startTime: { [Op.between]: [startDate, endDate] },
            },
            order: [['startTime', 'ASC']],
        });
    }

    async findOne(userId: number, id: number): Promise<Event> {
        const event = await this.eventModel.findOne({ where: { id, userId } });
        if (!event) {
            throw new NotFoundException(`Event with id ${id} not found`);
        }
        return event;
    }

    async create(userId: number, dto: CreateEventDto): Promise<Event> {
        return this.eventModel.create({ ...dto, userId } as any);
    }

    async update(userId: number, id: number, dto: UpdateEventDto): Promise<Event> {
        const event = await this.findOne(userId, id);
        await event.update(dto as any);

        // Если изменилось время встречи — удаляем уведомление
        if (dto.startTime !== undefined) {
            await this.notificationModel.destroy({
                where: { eventId: id, type: 'event_soon' },
            });
        }

        return event;
    }

    async remove(userId: number, id: number): Promise<void> {
        const event = await this.findOne(userId, id);
        await event.destroy();
    }
}