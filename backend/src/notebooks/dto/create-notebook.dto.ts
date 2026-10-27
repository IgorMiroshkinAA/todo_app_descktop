import { IsString, IsOptional } from 'class-validator';

export class CreateNotebookDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}