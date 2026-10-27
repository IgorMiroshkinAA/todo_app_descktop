import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Default } from 'sequelize-typescript';
import { Task } from './task.model';

@Table({ tableName: 'subtasks', timestamps: true })
export class Subtask extends Model<Subtask> {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
    declare id: number;

    @Column({ type: DataType.STRING(255), allowNull: false })
    title: string;

    @Default(false)
    @Column({ type: DataType.BOOLEAN })
    completed: boolean;

    @ForeignKey(() => Task)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    taskId: number;

    @BelongsTo(() => Task, {
        onDelete: 'CASCADE',
    })
    task: Task;
}