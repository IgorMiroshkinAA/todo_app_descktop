import { PartialType } from '@nestjs/mapped-types';
import { CreateSubtaskDto } from './create-subtask.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateSubtaskDto extends PartialType(CreateSubtaskDto) {
    @IsOptional()
    @IsBoolean()
    completed?: boolean;
}