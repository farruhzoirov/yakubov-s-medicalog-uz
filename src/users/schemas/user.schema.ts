import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'users', timestamps: false })
export class User {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: '' })
  lastname: string;

  @Prop({ default: '' })
  firstname: string;

  @Prop({ default: '' })
  middlename: string;

  @Prop({ default: '' })
  fullname: string;

  @Prop({ default: '' })
  shortname: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  system: string;

  @Prop({ default: 'secondary' })
  user_type: string;

  @Prop({ default: '' })
  expiry_date: string;

  @Prop({ default: '' })
  trial_start_date: string;

  @Prop({ default: '' })
  trial_end_date: string;

  @Prop({ default: '' })
  last_payment_date: string;

  @Prop({ default: '' })
  last_payment_amount: string;

  @Prop({ default: '' })
  total_payment_amount: string;

  @Prop({ default: 'FALSE' })
  is_deleted: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ username: 1 });
UserSchema.index({ id: 1 });
