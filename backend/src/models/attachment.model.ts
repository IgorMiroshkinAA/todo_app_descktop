import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Note } from './note.model';

@Table({ tableName: 'attachments', timestamps: true })
export class Attachment extends Model<Attachment> {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
    declare id: number;

    @Column({ type: DataType.STRING(255), allowNull: false })
    filename: string; // Оригинальное имя файла

    @Column({ type: DataType.STRING(255), allowNull: false })
    filepath: string; // Путь к файлу на диске

    @Column({ type: DataType.STRING(100), allowNull: false })
    mimetype: string; // MIME-тип файла

    @Column({ type: DataType.INTEGER, allowNull: false })
    size: number; // Размер в байтах

    @Column({ type: DataType.STRING(10), allowNull: true })
    extension: string; // Расширение файла

    @ForeignKey(() => Note)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    noteId: number;

    @BelongsTo(() => Note)
    note: Note;
}