import {  Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { getUserByUsername } from 'src/utils/getUser';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
    ) {}

    async login(authDto: AuthDto): Promise<string> {
        try {
            const { username, password } = authDto;
            const user = await getUserByUsername(username);
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
