import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6, { message: 'Пароль должен быть минимум 6 символов' })
    password: string;

    @IsOptional()
    @IsString()
    name?: string;
}