import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { User } from '../models/user.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectModel(User) private userModel: typeof User,
        private configService: ConfigService,
    ) {
        const secret = configService.get('JWT_SECRET');

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        } as any);
    }

    async validate(payload: any) {
        const user = await this.userModel.findByPk(payload.sub);
        if (!user) {
            console.warn('🔴 User not found for payload.sub:', payload.sub);
            throw new UnauthorizedException();
        }
        return { id: user.id, email: user.email, role: user.role };
    }
}