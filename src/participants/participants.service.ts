import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Participant, ParticipantDocument } from './schemas/participant.schema';
import { UpsertParticipantDto } from './dto/participants.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectModel(Participant.name)
    private readonly participantModel: Model<ParticipantDocument>,
  ) { }

  async upsert(upsertParticipantDto: UpsertParticipantDto) {
    try {
      if (upsertParticipantDto._id) {
        const found = await this.participantModel.findById(
          upsertParticipantDto._id,
        );

        if (!found) {
          throw new NotFoundException('Participant not found');
        }

        const updated = await this.participantModel.findByIdAndUpdate(
          upsertParticipantDto._id,
          {
            fullName: upsertParticipantDto.fullName,
            specialty: upsertParticipantDto.specialty,
            isActive: upsertParticipantDto.isActive,
          },
          { returnDocument: 'after' },
        );

        return {
          success: true,
          message: 'Participant updated successfully',
          data: updated,
        };
      }

      const created = await this.participantModel.create({
        fullName: upsertParticipantDto.fullName,
        specialty: upsertParticipantDto.specialty,
      });

      return {
        success: true,
        message: 'Participant created successfully',
        data: created,
      };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async list() {
    try {
      const data = await this.participantModel
        .find()
        .select('fullName specialty isActive')
        .lean();

      return {
        success: true,
        message: 'Participants fetched successfully',
        data,
      };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async filterParticipants(participantId?: string[]) {
    try {
      if (!participantId?.length) return [];
      const data = await this.participantModel
        .find({ _id: { $in: participantId } }).lean().exec()

      return (data || []).map((item) => ({
        id: item._id,
        fullname: item.fullName,
        specialty: item.specialty,
      })) as any[];
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}
