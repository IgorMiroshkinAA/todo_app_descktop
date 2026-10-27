import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Event } from '../models/event.model';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import {Notification} from "../models/notification.model";

@Module({
    imports: [SequelizeModule.forFeature([Event, Notification])],
    controllers: [EventsController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule {}