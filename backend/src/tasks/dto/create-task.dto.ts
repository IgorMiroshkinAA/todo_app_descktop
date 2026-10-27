import { IsString, IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: string;

  @IsOptional()
  @IsEnum(['todo', 'in_progress', 'done'])
  status?: TaskStatus;
}