import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { BackupModule } from './backup/backup.module';
import authConfig from './config/auth.config';
import botConfig from './config/bot.config';
import sheetConfig from './config/sheet.config';
import databaseConfig from './config/database.config';
import { RegistrationsModule } from './registrations/registrations.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ParticipantsModule } from './participants/participants.module';
import { AuthMiddleware } from './auth/auth.middleware';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, botConfig, sheetConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          uri: configService.get('CONFIG_DATABASE').MONGODB_URI,
          maxPoolSize: 10,
          minPoolSize: 2,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        };
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    // BackupModule,
    RegistrationsModule,
    AuthModule,
    UsersModule,
    ParticipantsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthMiddleware, JwtService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}

