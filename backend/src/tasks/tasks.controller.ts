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
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.tasksService.findAll(user.id, query);
  }

  @Get('calendar')
  getTasksForCalendar(
      @CurrentUser() user: any,
      @Query('start') startDate: string,
      @Query('end') endDate: string,
  ) {
    return this.tasksService.getTasksForCalendar(user.id, startDate, endDate);
  }

  @Get('export')
  async exportTasks(@CurrentUser() user: any) {
    return this.tasksService.exportTasks(user.id);
  }

  @Get('export/excel')
  async exportTasksExcel(@CurrentUser() user: any, @Res() res: Response) {
    const tasks = await this.tasksService.exportTasks(user.id);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Задачи');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Название', key: 'title', width: 30 },
      { header: 'Описание', key: 'description', width: 40 },
      { header: 'Дата выполнения', key: 'dueDate', width: 20 },
      { header: 'Выполнено', key: 'completed', width: 15 },
      { header: 'Приоритет', key: 'priority', width: 15 },
      { header: 'Статус', key: 'status', width: 20 },
      { header: 'Создано', key: 'createdAt', width: 25 },
    ];

    tasks.forEach((task) => {
      const plainTask = task.get({ plain: true } as any) || task.toJSON();
      worksheet.addRow({
        id: plainTask.id,
        title: plainTask.title,
        description: plainTask.description || '',
        dueDate: plainTask.dueDate
            ? new Date(plainTask.dueDate).toLocaleDateString('ru-RU')
            : '',
        completed: plainTask.completed ? 'Да' : 'Нет',
        priority: plainTask.priority,
        status: plainTask.status,
        createdAt: new Date(plainTask.createdAt).toLocaleString('ru-RU'),
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=tasks_${new Date().toISOString().split('T')[0]}.xlsx`,
    );
    res.send(buffer);
  }

  @Post('import')
  async importTasks(@CurrentUser() user: any, @Body() tasksData: any[]) {
    return this.tasksService.importTasks(user.id, tasksData);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.findOne(user.id, +id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(user.id, createTaskDto);
  }

  @Put(':id')
  update(
      @CurrentUser() user: any,
      @Param('id') id: string,
      @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, +id, updateTaskDto);
  }

  @Put(':id/move')
  moveTaskToDate(
      @CurrentUser() user: any,
      @Param('id') id: string,
      @Body('date') newDate: string,
  ) {
    return this.tasksService.moveTaskToDate(user.id, +id, newDate);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.remove(user.id, +id);
  }
}