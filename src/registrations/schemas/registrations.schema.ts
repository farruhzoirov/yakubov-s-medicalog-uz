import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { UserProfile } from 'src/type/interfaces/user.interface';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export type RegistrationsDocument = Registrations & Document;

@Schema({ timestamps: true })
export class Registrations {
  @Prop({ type: Number, required: true, default: 1 })
  yearlyCount: number;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  birthYear: string;

  @Prop({ required: true })
  age: number;

  @Prop({ required: true, enum: Gender })
  gender: Gender;

  @Prop({ default: null })
  medicalHistoryNumber: string;

  @Prop({ default: null })
  region: string;

  @Prop({ default: null })
  district: string;

  @Prop({ default: null })
  address: string;

  @Prop({ default: null })
  operationStartDateTime: string;

  @Prop({ default: null })
  operationEndDateTime: string;

  @Prop({ default: null })
  preOperationDiagnosis: string;

  @Prop({ default: null })
  operationName: string;

  @Prop({ default: null })
  postOperationDiagnosis: string;

  @Prop({ type: [String], default: [] })
  operationParticipants: string[];

  @Prop({ default: null })
  phone: string;

  @Prop({ type: [Object], default: [] })
  participants: UserProfile[];

  @Prop({ type: Object, default: null })
  createdBy: UserProfile;
}

export const RegistrationsSchema = SchemaFactory.createForClass(Registrations);

RegistrationsSchema.index({ fullName: 1, phone: 1, address: 1 });
RegistrationsSchema.index({ medicalHistoryNumber: 1 });
RegistrationsSchema.index({ region: 1, district: 1 });
RegistrationsSchema.index({ operationStartDateTime: 1 });
RegistrationsSchema.index({ birthYear: 1 });
RegistrationsSchema.index({ createdAt: 1 });
RegistrationsSchema.index({ gender: 1 });
