import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { UpsertParticipantDto } from './dto/participants.dto';

@Controller('participants')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @HttpCode(HttpStatus.OK)
  @Post('upsert')
  async upsert(@Body() upsertParticipantDto: UpsertParticipantDto) {
    const { success, message, data } =
      await this.participantsService.upsert(upsertParticipantDto);
    return {
      success,
      message,
      data,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('list')
  async list() {
    const { success, message, data } = await this.participantsService.list();
    return {
      success,
      message,
      data,
    };
  }
}
