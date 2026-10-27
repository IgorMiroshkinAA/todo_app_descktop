import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { PomodoroService } from './pomodoro.service';
import { StartPomodoroDto } from './dto/pomodoro.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class PomodoroController {
    constructor(private readonly pomodoroService: PomodoroService) {}

    @Get('tasks/:taskId/pomodoro/sessions')
    getSessions(@CurrentUser() user: any, @Param('taskId') taskId: string) {
        return this.pomodoroService.getSessionsByTask(user.id, +taskId);
    }

    @Get('tasks/:taskId/pomodoro/stats')
    getStats(@CurrentUser() user: any, @Param('taskId') taskId: string) {
        return this.pomodoroService.getStatsByTask(user.id, +taskId);
    }

    @Post('tasks/:taskId/pomodoro/start')
    start(
        @CurrentUser() user: any,
        @Param('taskId') taskId: string,
        @Body() dto: StartPomodoroDto,
    ) {
        return this.pomodoroService.startSession(user.id, +taskId, dto);
    }

    @Put('pomodoro/:sessionId/stop')
    stop(
        @CurrentUser() user: any,
        @Param('sessionId') sessionId: string,
        @Body('completed') completed: boolean,
    ) {
        return this.pomodoroService.stopSession(user.id, +sessionId, completed);
    }
}