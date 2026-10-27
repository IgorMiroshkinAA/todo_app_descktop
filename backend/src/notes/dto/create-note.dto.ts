import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  // notebookId будет браться из параметра пути, поэтому здесь его нет
}