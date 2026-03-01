import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import {
  Registrations,
  RegistrationsSchema,
} from './schemas/registrations.schema';
import {
  RegistrationOption,
  RegistrationOptionSchema,
} from './schemas/registration-option.schema';
import { UsersModule } from '../users/users.module';
import { ParticipantsService } from 'src/participants/participants.service';
import { Participant, ParticipantSchema } from 'src/participants/schemas/participant.schema';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Registrations.name, schema: RegistrationsSchema },
      { name: RegistrationOption.name, schema: RegistrationOptionSchema },
      { name: Participant.name, schema: ParticipantSchema },
    ]),
  ],
  controllers: [RegistrationsController],
  providers: [RegistrationsService, ParticipantsService],
})
export class RegistrationsModule { }
