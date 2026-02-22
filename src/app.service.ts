import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSheetData } from './utils/sheet';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async syncSheetData() {
    try {
      const sheetId = this.configService.get('SHEET.GOOGLE_SHEET_ID');
      const apiKey = this.configService.get('SHEET.GOOGLE_API_KEY');
      return await getSheetData(sheetId, apiKey);
    } catch (error) {
      throw new Error('Error syncing sheet data:', error);
    }
  }
}
