import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User) private userModel: typeof User,
        private jwtService: JwtService,
    ) {}

    async register(dto: RegisterDto) {
        // Проверяем, существует ли пользователь
        const existing = await this.userModel.findOne({ where: { email: dto.email } });
        if (existing) {
            throw new ConflictException('Пользователь с таким email уже существует');
        }

        // Хэшируем пароль
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.userModel.create({
            email: dto.email,
            password: hashedPassword,
            name: dto.name || dto.email.split('@')[0],
        } as any);

        const token = this.generateToken(user);

        return {
            user: this.sanitizeUser(user),
            token,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.userModel.findOne({ where: { email: dto.email } });
        if (!user) {
            throw new UnauthorizedException('Неверный email или пароль');
        }

        const isValid = await bcrypt.compare(dto.password, user.password);
        if (!isValid) {
            throw new UnauthorizedException('Неверный email или пароль');
        }

        const token = this.generateToken(user);

        return {
            user: this.sanitizeUser(user),
            token,
        };
    }

    async getProfile(userId: number) {
        const user = await this.userModel.findByPk(userId);
        if (!user) {
            throw new UnauthorizedException('Пользователь не найден');
        }
        return this.sanitizeUser(user);
    }

    private generateToken(user: User): string {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        console.log('🔐 Generating token with payload:', payload);
        const token = this.jwtService.sign(payload);
        console.log('🔐 Token generated (first 30 chars):', token.substring(0, 30));
        return token;
    }

    private sanitizeUser(user: User) {
        const { password, ...rest } = user.toJSON() as any;
        return rest;
    }
}