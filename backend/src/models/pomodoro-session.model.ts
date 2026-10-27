import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Default } from 'sequelize-typescript';
import { Task } from './task.model';

export type PomodoroType = 'work' | 'short_break' | 'long_break';

@Table({ tableName: 'pomodoro_sessions', timestamps: true })
export class PomodoroSession extends Model<PomodoroSession> {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
    declare id: number;

    @Column({ type: DataType.DATE, allowNull: false })
    declare startedAt: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare endedAt: Date;

    @Default(25)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare duration: number; // в минутах

    @Default('work')
    @Column({ type: DataType.ENUM('work', 'short_break', 'long_break'), allowNull: false })
    declare type: PomodoroType;

    @Default(false)
    @Column({ type: DataType.BOOLEAN })
    declare completed: boolean;

    @ForeignKey(() => Task)
    @Column({
        type: DataType.INTEGER.UNSIGNED,
        allowNull: false,
        onDelete: 'CASCADE',
    })
    declare taskId: number;

    @BelongsTo(() => Task, { onDelete: 'CASCADE' })
    declare task: Task;
}