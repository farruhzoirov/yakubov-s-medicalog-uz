import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSheetData } from './utils/sheet';
import { UsersService } from './users/users.service';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async syncSheetData() {
    try {
      const sheetId = this.configService.get('SHEET.GOOGLE_SHEET_ID');
      const apiKey = this.configService.get('SHEET.GOOGLE_API_KEY');
      const jsonData = await getSheetData(sheetId, apiKey);
      console.log(jsonData);
      if (jsonData?.length) {
        await this.usersService.syncFromSheetData(jsonData);
      }
      return jsonData;
    } catch (error) {
      console.error(error);
      throw new Error('Error syncing sheet data: ' + (error?.message ?? error));
    }
  }
}
