import {
    Controller,
    Get,
    Put,
    Delete,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    findAll(@CurrentUser() user: any) {
        return this.notificationsService.findAll(user.id);
    }

    @Get('unread')
    findUnread(@CurrentUser() user: any) {
        return this.notificationsService.findUnread(user.id);
    }

    @Put(':id/read')
    markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
        return this.notificationsService.markAsRead(user.id, +id);
    }

    @Put('read-all')
    markAllAsRead(@CurrentUser() user: any) {
        return this.notificationsService.markAllAsRead(user.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@CurrentUser() user: any, @Param('id') id: string) {
        return this.notificationsService.remove(user.id, +id);
    }
}