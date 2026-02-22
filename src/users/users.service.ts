import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import type { UserProfile } from 'src/type/interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getUserByUsername(username: string): Promise<UserProfile | null> {
    const user = await this.userModel.findOne({ username }).lean().exec();
    return user ? this.toUserProfile(user) : null;
  }

  async getUsersByUserIds(userIds: string[]): Promise<UserProfile[]> {
    if (!userIds?.length) return [];
    const users = await this.userModel
      .find({ id: { $in: userIds } })
      .lean()
      .exec();
    return users.map((u) => {
      const profile = this.toUserProfile(u);
      const { password, username, ...rest } = profile;
      return rest as UserProfile;
    });
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const users = await this.userModel.find().lean().exec();
    return users.map((u) => {
      const profile = this.toUserProfile(u);
      const { password, username, ...rest } = profile;
      return rest as UserProfile;
    });
  }

  /** Sync users from Google Sheet data (replace by id, upsert). Skips empty/invalid rows. */
  async syncFromSheetData(jsonData: Record<string, unknown>[]): Promise<void> {
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      return;
    }
    const validRows = jsonData.filter((row) => this.isValidUserRow(row));
    if (validRows.length === 0) {
      return;
    }
    const ops = validRows.map((row) => ({
      replaceOne: {
        filter: { id: row.id },
        replacement: row as unknown as User,
        upsert: true,
      },
    }));
    await this.userModel.bulkWrite(ops as never[]);
  }

  private isValidUserRow(row: Record<string, unknown>): boolean {
    const id = row.id != null ? String(row.id).trim() : '';
    const username = row.username != null ? String(row.username).trim() : '';
    return id.length > 0 && username.length > 0;
  }

  private toUserProfile(doc: Record<string, unknown>): UserProfile {
    return {
      id: String(doc.id),
      username: String(doc.username),
      password: doc.password as string,
      lastname: String(doc.lastname ?? ''),
      firstname: String(doc.firstname ?? ''),
      middlename: String(doc.middlename ?? ''),
      fullname: String(doc.fullname ?? ''),
      shortname: String(doc.shortname ?? ''),
      phone: String(doc.phone ?? ''),
      system: String(doc.system ?? ''),
      user_type: (doc.user_type as 'main' | 'secondary') ?? 'secondary',
      expiry_date: String(doc.expiry_date ?? ''),
      trial_start_date: (doc.trial_start_date as string) || null,
      trial_end_date: (doc.trial_end_date as string) || null,
      last_payment_date: (doc.last_payment_date as string) || null,
      last_payment_amount: (doc.last_payment_amount as string) ?? '',
      total_payment_amount: (doc.total_payment_amount as string) ?? '',
      is_deleted: (doc.is_deleted as 'TRUE' | 'FALSE') ?? 'FALSE',
    };
  }
}
