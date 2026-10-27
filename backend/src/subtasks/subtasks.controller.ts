import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { SubtasksService } from './subtasks.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class SubtasksController {
    constructor(private readonly subtasksService: SubtasksService) {}

    @Get('tasks/:taskId/subtasks')
    findAllByTask(@CurrentUser() user: any, @Param('taskId') taskId: string) {
        return this.subtasksService.findAllByTask(user.id, +taskId);
    }

    @Post('tasks/:taskId/subtasks')
    create(
        @CurrentUser() user: any,
        @Param('taskId') taskId: string,
        @Body() createSubtaskDto: CreateSubtaskDto,
    ) {
        return this.subtasksService.create(user.id, +taskId, createSubtaskDto);
    }

    @Put('subtasks/:id')
    update(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() updateSubtaskDto: UpdateSubtaskDto,
    ) {
        return this.subtasksService.update(user.id, +id, updateSubtaskDto);
    }

    @Delete('subtasks/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@CurrentUser() user: any, @Param('id') id: string) {
        return this.subtasksService.remove(user.id, +id);
    }
}