import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ParticipantDocument = Participant & Document;

@Schema({ timestamps: true })
export class Participant {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  specialty: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);
