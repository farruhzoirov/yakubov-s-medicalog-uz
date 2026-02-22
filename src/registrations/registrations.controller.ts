import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  AuthDto,
  CreateRegistrationDto,
  GetFilteredRegistrationsDto,
  UpdateRegistrationDto,
  ReportDto,
  ContactDto,
} from "./dto/registrations.dto";
import { RegistrationsService } from "./registrations.service";
import { UserProfile } from "src/type/interfaces/user.interface";

@Controller("registrations")
@UsePipes(new ValidationPipe({ whitelist: true }))
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @HttpCode(HttpStatus.OK)
  @Post("/contact")
  async contact(@Body() contactDto: ContactDto) {
    await this.registrationsService.contact(contactDto);
    return {
      success: true,
      message: "Message sent successfully",
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post("/reports")
  async generateReport(@Body() reportDto: ReportDto) {
    const { wordFilePath, pdfFilePath } =
      await this.registrationsService.generateReport(reportDto);
    return {
      success: true,
      message: "Report generated successfully",
      filePaths: {
        wordFilePath,
        pdfFilePath,
      }
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post("print")
  async generateWordFile(
    @Body() forGenerateWordDto: GetFilteredRegistrationsDto,
  ) {
    const filePaths =
      await this.registrationsService.generateWordAndPdfFile(
        forGenerateWordDto,
      );
    return {
      success: true,
      message: "Files generated successfully",
      filePaths,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post("/get-list")
  async getFilteredRegistrations(
    @Body() getFilteredRegistrationsDto: GetFilteredRegistrationsDto,
  ) {
    const {
      data,
      totalCount,
      totalPagesCount,
      page,
      limit,
      pendingReportsCount,
    } = await this.registrationsService.getFilteredRegistrations(
      getFilteredRegistrationsDto,
    );
    return {
      message: "Registrations...",
      success: true,
      data,
      totalCount,
      totalPagesCount,
      page,
      limit,
      pendingReportsCount,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Get("users")
  async getUsers() {
    const users = await this.registrationsService.getUsers();
    return {
      message: "Users fetched successfully",
      success: true,
      data: users,
    };
  }




  @Post("create")
  async createRegistration(
    @Body() createRegistrationDto: CreateRegistrationDto,
    @Req() req: any,
  ) {
    const user = req.user as UserProfile;
    const { totalCount, totalPagesCount } =
      await this.registrationsService.createRegistration(createRegistrationDto, user);
    return {
      message: "Registration created successfully",
      success: true,
      totalCount,
      totalPagesCount,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post("update")
  async updateRegistration(
    @Body() updateRegistrationDto: UpdateRegistrationDto,
  ) {
    const { totalCount, totalPagesCount } =
      await this.registrationsService.updateRegistration(updateRegistrationDto);
    return {
      message: "Registration updated successfully",
      success: true,
      totalCount,
      totalPagesCount,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post("delete")
  async deleteRegistration(@Body("id") id: string) {
    const { totalCount, totalPagesCount } =
      await this.registrationsService.deleteRegistration(id);
    return {
      message: "Registration deleted successfully",
      success: true,
      totalCount,
      totalPagesCount,
    };
  }
}
