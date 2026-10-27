import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
import { Task } from './models/task.model';
import { Note } from './models/note.model';
import { Subtask } from './models/subtask.model';
import { Notebook } from './models/notebook.model';
import { Notification } from "./models/notification.model";
import { TasksModule } from './tasks/tasks.module';
import { NotebooksModule } from './notebooks/notebooks.module';
import { NotesModule } from './notes/notes.module';
import { SubtasksModule } from "./subtasks/subtasks.module";
import {NotificationsModule} from "./notifications/notifications.module";
import {AttachmentsModule} from "./attachments/attachment.module";
import {Attachment} from "./models/attachment.model";
import {PomodoroSession} from "./models/pomodoro-session.model";
import {PomodoroModule} from "./pomodoro/pomodoro.module";
import { Event } from "./models/event.model";
import {EventsModule} from "./events/events.module";
import {User} from "./models/user.model";
import {AuthModule} from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) ?? 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadModels: true,
      synchronize: true,
      models: [Task, Notebook, Note, Subtask, Notification, Attachment, PomodoroSession, Event, User],
    }),
    TasksModule,
    NotebooksModule,
    NotesModule,
    SubtasksModule,
    NotificationsModule,
    AttachmentsModule,
    PomodoroModule,
    EventsModule,
    AuthModule,
  ],
})
export class AppModule {}