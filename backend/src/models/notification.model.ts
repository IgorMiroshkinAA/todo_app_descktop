import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Default } from 'sequelize-typescript';
import { Task } from './task.model';
import { Event } from './event.model';

export type NotificationType = 'overdue' | 'upcoming' | 'event_soon';

@Table({ tableName: 'notifications', timestamps: true })
export class Notification extends Model<Notification> {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
    declare id: number;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare message: string;

    @Column({ type: DataType.ENUM('overdue', 'upcoming', 'event_soon'), allowNull: false })
    declare type: NotificationType;

    @Default(false)
    @Column({ type: DataType.BOOLEAN })
    declare read: boolean;

    // Для задач (может быть null для встреч)
    @ForeignKey(() => Task)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    declare taskId: number | null;

    @BelongsTo(() => Task, { onDelete: 'CASCADE' })
    declare task: Task;

    // Для встреч (может быть null для задач)
    @ForeignKey(() => Event)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    declare eventId: number | null;

    @BelongsTo(() => Event, { onDelete: 'CASCADE' })
    declare event: Event;

    @Column({ type: DataType.DATE, allowNull: false })
    declare createdAt: Date;
}