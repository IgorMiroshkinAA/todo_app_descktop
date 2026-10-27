import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Notebook } from './notebook.model';
import { Attachment } from './attachment.model';
import { User } from './user.model';

@Table({ tableName: 'notes', timestamps: true })
export class Note extends Model<Note> {
  @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true })
  declare id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare content: string;

  @ForeignKey(() => Notebook)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare notebookId: number;

  @BelongsTo(() => Notebook, { onDelete: 'CASCADE' })
  declare notebook: Notebook;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User;

  @HasMany(() => Attachment, { onDelete: 'CASCADE' })
  declare attachments: Attachment[];
}