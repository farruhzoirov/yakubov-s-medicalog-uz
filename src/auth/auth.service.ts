import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
    ) {}

    async login(authDto: AuthDto): Promise<string> {
        try {
            const { username, password } = authDto;
            const user = await this.usersService.getUserByUsername(username);
            if (!user) {
                throw new UnauthorizedException('Foydalanuvchi topilmadi');
            }
            if (user.password !== password) {
                throw new UnauthorizedException('Maxfiy kod noto\'g\'ri');
            }
            delete user.password;
            delete user.username;
            return this.jwtService.signAsync(user);
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new InternalServerErrorException('Error logging in:', error);
        }
    }
}
