import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PomodoroSession } from '../models/pomodoro-session.model';
import { Task } from '../models/task.model';
import { PomodoroController } from './pomodoro.controller';
import { PomodoroService } from './pomodoro.service';

@Module({
    imports: [SequelizeModule.forFeature([PomodoroSession, Task])],
    controllers: [PomodoroController],
    providers: [PomodoroService],
    exports: [PomodoroService],
})
export class PomodoroModule {}