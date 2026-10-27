import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) {}

    @Get()
    findAll(@CurrentUser() user: any) {
        return this.eventsService.findAll(user.id);
    }

    @Get('calendar')
    findForCalendar(
        @CurrentUser() user: any,
        @Query('start') start: string,
        @Query('end') end: string,
    ) {
        return this.eventsService.findForCalendar(user.id, start, end);
    }

    @Get(':id')
    findOne(@CurrentUser() user: any, @Param('id') id: string) {
        return this.eventsService.findOne(user.id, +id);
    }

    @Post()
    create(@CurrentUser() user: any, @Body() createEventDto: CreateEventDto) {
        return this.eventsService.create(user.id, createEventDto);
    }

    @Put(':id')
    update(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() updateEventDto: UpdateEventDto,
    ) {
        return this.eventsService.update(user.id, +id, updateEventDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@CurrentUser() user: any, @Param('id') id: string) {
        return this.eventsService.remove(user.id, +id);
    }
}