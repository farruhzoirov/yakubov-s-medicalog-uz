import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RegistrationOptionDocument = RegistrationOption & Document;

export enum RegistrationOptionType {
  preOperationDiagnosis = 'preOperationDiagnosis',
  operationName = 'operationName',
  postOperationDiagnosis = 'postOperationDiagnosis',
}

@Schema({ timestamps: true })
export class RegistrationOption {
  @Prop({ required: true, enum: RegistrationOptionType })
  type: RegistrationOptionType;

  @Prop({ required: true })
  label: string;
}

export const RegistrationOptionSchema =
  SchemaFactory.createForClass(RegistrationOption);

RegistrationOptionSchema.index({ type: 1 });
