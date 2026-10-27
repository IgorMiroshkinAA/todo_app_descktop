import { IsOptional, IsInt, IsEnum, IsDateString } from 'class-validator';

export type PomodoroType = 'work' | 'short_break' | 'long_break';

export class StartPomodoroDto {
    @IsOptional()
    @IsInt()
    duration?: number; // в минутах, по умолчанию 25

    @IsOptional()
    @IsEnum(['work', 'short_break', 'long_break'])
    type?: PomodoroType;
}

export class StopPomodoroDto {
    @IsOptional()
    completed?: boolean;
}