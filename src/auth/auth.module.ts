import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const auth = configService.get<{ JWT_SECRET?: string; JWT_EXPIRES_IN?: string }>('AUTH');
        const expiresIn = auth?.JWT_EXPIRES_IN ?? '1h';
        return {
          secret: auth?.JWT_SECRET ?? 'secret',
          signOptions: { expiresIn: expiresIn as '1h' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
