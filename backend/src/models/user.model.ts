import { Table, Column, Model, DataType, Default, HasMany } from 'sequelize-typescript';
import { Task } from './task.model';
import { Notebook } from './notebook.model';
import { Event } from './event.model';

@Table({ tableName: 'users', timestamps: true })
export class User extends Model<User> {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
    declare id: number;

    @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
    declare email: string;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare password: string;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare name: string;

    @Default('user')
    @Column({ type: DataType.ENUM('user', 'admin'), allowNull: false })
    declare role: string;

    @Default(false)
    @Column({ type: DataType.BOOLEAN })
    declare emailVerified: boolean;

    @HasMany(() => Task, { onDelete: 'CASCADE' })
    declare tasks: Task[];

    @HasMany(() => Notebook, { onDelete: 'CASCADE' })
    declare notebooks: Notebook[];

    @HasMany(() => Event, { onDelete: 'CASCADE' })
    declare events: Event[];
}