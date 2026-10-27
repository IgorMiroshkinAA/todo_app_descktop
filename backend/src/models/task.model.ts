import { Table, Column, Model, DataType, Default, HasMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Subtask } from './subtask.model';
import { PomodoroSession } from './pomodoro-session.model';
import { User } from './user.model';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

@Table({ tableName: 'tasks', timestamps: true })
export class Task extends Model<Task> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
  declare id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare dueDate: Date;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  declare completed: boolean;

  @Default('medium')
  @Column({ type: DataType.ENUM('low', 'medium', 'high') })
  declare priority: string;

  @Default('todo')
  @Column({ type: DataType.ENUM('todo', 'in_progress', 'done') })
  declare status: TaskStatus;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @HasMany(() => Subtask)
  declare subtasks: Subtask[];

  @HasMany(() => PomodoroSession, { onDelete: 'CASCADE' })
  declare pomodoroSessions: PomodoroSession[];
}