import { IsString, IsOptional, IsDateString, IsEnum, IsArray } from 'class-validator';

export type EventType = 'meeting' | 'call' | 'appointment' | 'other';

export class CreateEventDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDateString()
    startTime: string;

    @IsOptional()
    @IsDateString()
    endTime?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsEnum(['meeting', 'call', 'appointment', 'other'])
    type?: EventType;

    @IsOptional()
    @IsArray()
    attendees?: string[];
}