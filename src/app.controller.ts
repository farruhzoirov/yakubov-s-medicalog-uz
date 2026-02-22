import { BadRequestException, Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/sheet-sync')
  async syncSheet() {
    try {
      await this.appService.syncSheetData();

      return {
        success: true,
        message: 'Sheet data synced successfully',
      }
    } catch (error) {
      throw new BadRequestException('Error syncing sheet data:', error);
    }
  }
}
