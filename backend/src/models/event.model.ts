import { Table, Column, Model, DataType, Default, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Notification } from './notification.model';
import { User } from './user.model';

export type EventType = 'meeting' | 'call' | 'appointment' | 'other';

@Table({ tableName: 'events', timestamps: true })
export class Event extends Model<Event> {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
    declare id: number;

    @Column({ type: DataType.STRING(255), allowNull: false })
    declare title: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare description: string;

    @Column({ type: DataType.DATE, allowNull: false })
    declare startTime: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    declare endTime: Date;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare location: string;

    @Default('meeting')
    @Column({ type: DataType.ENUM('meeting', 'call', 'appointment', 'other'), allowNull: false })
    declare type: EventType;

    @Default('[]')
    @Column({ type: DataType.JSON, allowNull: true })
    declare attendees: string[];

    @Default(false)
    @Column({ type: DataType.BOOLEAN })
    declare synced: boolean;

    @Column({ type: DataType.STRING(255), allowNull: true })
    declare externalId: string;

    @Default('none')
    @Column({ type: DataType.ENUM('none', 'google', 'yandex', 'mailru'), allowNull: false })
    declare externalProvider: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    declare userId: number;

    @BelongsTo(() => User, { onDelete: 'CASCADE' })
    declare user: User;

    @HasMany(() => Notification)
    declare notifications: Notification[];
}