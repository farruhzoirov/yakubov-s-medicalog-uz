import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { ConfigService } from "@nestjs/config";
import { BackupService } from "src/backup/backup.service";
import { createDateRangeFilter } from "src/helpers/dateRangeFilter.helper";
import { formatDate } from "src/helpers/formatDate.helper";
import { formatRegistrations } from "src/helpers/formatRegistrations.helper";
import {
  generateReportPdf,
  generateReportWord,
  getReportFileTimestamp,
  ReportStats,
} from "src/helpers/generateReport.helper";
import {
  generatePdfFile,
  generateWordFile,
} from "src/helpers/generateWordFIle.helper";
import { getAgeHelper } from "src/helpers/getAge.helper";
import { universalSearchQuery } from "src/helpers/search.helper";
import {
  AuthDto,
  CreateRegistrationDto,
  GetFilteredRegistrationsDto,
  UpdateRegistrationDto,
  ReportDto,
  ContactDto,
} from "./dto/registrations.dto";
import {
  Registrations,
  RegistrationsDocument,
} from "./schemas/registrations.schema";
import { buildReportPipeline } from "../helpers/build-report-pipeline.helper";
import { sendMessage } from "src/helpers/send-message";
import { getUsersByUserIds } from "src/utils/getUser";
import { UserProfile } from "src/type/interfaces/user.interface";

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectModel(Registrations.name)
    private readonly registrationsModel: Model<RegistrationsDocument>,
    private readonly configService: ConfigService,
    // private readonly backupService: BackupService
  ) {}

  async contact(contactDto: ContactDto) {
    const { name, tgOrPhone } = contactDto;
    const messageText = `🔔 Yangi xabar! \n\n👤 Ism: ${name}\n📱 Telegram/Telefon: ${
      tgOrPhone || "Ko'rsatilmagan"
    }\n`;
    await sendMessage(messageText, this.configService.get("BOT").TELEGRAM_BOT_TOKEN, this.configService.get("BOT").ADMIN_1_ID, this.configService.get("BOT").ADMIN_2_ID);
  }

  async generateWordAndPdfFile(
    forGenerateWordDto: GetFilteredRegistrationsDto,
  ): Promise<{ wordFilePath: string; pdfFilePath: string }> {
    const filters: Record<string, any> = {};

    if (forGenerateWordDto.createdAtFrom || forGenerateWordDto.createdAtTo) {
      const createdAtFilter = createDateRangeFilter(
        forGenerateWordDto.createdAtFrom,
        forGenerateWordDto.createdAtTo,
      );
      if (createdAtFilter) filters.createdAt = createdAtFilter;
    }

    if (forGenerateWordDto.birthDateFrom || forGenerateWordDto.birthDateTo) {
      filters.birthDate = {};
      if (forGenerateWordDto.birthDateFrom)
        filters.birthDate.$gte = forGenerateWordDto.birthDateFrom;
      if (forGenerateWordDto.birthDateTo)
        filters.birthDate.$lte = forGenerateWordDto.birthDateTo;
    }

    if (forGenerateWordDto.ageFrom || forGenerateWordDto.ageTo) {
      filters.age = {};
      if (forGenerateWordDto.ageFrom)
        filters.age.$gte = forGenerateWordDto.ageFrom;
      if (forGenerateWordDto.ageTo) filters.age.$lte = forGenerateWordDto.ageTo;
    }

    if (forGenerateWordDto.gender) filters.gender = forGenerateWordDto.gender;

    const addRegexFilter = (field: string, value?: string) => {
      if (value?.trim()) {
        filters[field] = { $regex: value.trim(), $options: "i" };
      }
    };

    addRegexFilter("address", forGenerateWordDto.address);
    addRegexFilter("otherAddress", forGenerateWordDto.otherAddress);
    addRegexFilter("job", forGenerateWordDto.job);
    addRegexFilter("otherJob", forGenerateWordDto.otherJob);
    addRegexFilter("visitReason", forGenerateWordDto.visitReason);
    addRegexFilter("otherVisitReason", forGenerateWordDto.otherVisitReason);
    addRegexFilter("radiologyReport", forGenerateWordDto.radiologyReport);
    addRegexFilter(
      "otherRadiologyReport",
      forGenerateWordDto.otherRadiologyReport,
    );

    const pipeline: any[] = [{ $match: filters }, { $sort: { createdAt: 1 } }];

    const registrations = await this.registrationsModel
      .aggregate(pipeline)
      .exec();

    if (!registrations) {
      throw new NotFoundException({
        success: false,
        message: "Registrations not found",
      });
    }

    const formattedRegistrations = formatRegistrations(registrations);
    const [wordFilePath, pdfFilePath] = await Promise.all([
      generateWordFile(formattedRegistrations),
      generatePdfFile(formattedRegistrations),
    ]);
    return {
      wordFilePath,
      pdfFilePath,
    };
  }

  async generateReport(dto: ReportDto): Promise<{
    wordFilePath: string;
    pdfFilePath: string;
  }> {
    const { from, to } = dto;

    const pipeline = buildReportPipeline(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );

    const result = await this.registrationsModel
      .aggregate<ReportStats & { dateFrom?: Date; dateTo?: Date }>(pipeline)
      .exec();

    const stats = result[0];
    if (!stats) {
      throw new NotFoundException({
        success: false,
        message: "No registration data for report",
      });
    }

    const dateFrom =
      from && to
        ? new Date(from)
        : stats.dateFrom
          ? new Date(stats.dateFrom)
          : new Date();
    const dateTo =
      from && to
        ? new Date(to)
        : stats.dateTo
          ? new Date(stats.dateTo)
          : new Date();

    const reportStats = {
      total: stats.total ?? 0,
      women: stats.women ?? 0,
      men: stats.men ?? 0,
      unemployed: stats.unemployed ?? 0,
      pensioners: stats.pensioners ?? 0,
      disabled: stats.disabled ?? 0,
    };

    const fileTimestamp = getReportFileTimestamp();
    const [wordFilePath, pdfFilePath] = await Promise.all([
      generateReportWord(reportStats, dateFrom, dateTo, fileTimestamp),
      generateReportPdf(reportStats, dateFrom, dateTo, fileTimestamp),
    ]);

    return { wordFilePath, pdfFilePath };
  }

  async getFilteredRegistrations(dto: GetFilteredRegistrationsDto) {
    const page = dto.page && dto.page > 0 ? dto.page : 1;
    const limit = dto.limit && dto.limit > 0 ? dto.limit : 20;
    const skip = (page - 1) * limit;

    const filters: Record<string, any> = {};

    if (dto.search?.trim()) {
      Object.assign(
        filters,
        await universalSearchQuery(dto.search.trim(), [
          "fullName",
          "phone",
          "address",
          "otherAddress",
          "job",
          "otherJob",
          "visitReason",
          "otherVisitReason",
          "radiologyReport",
          "otherRadiologyReport",
        ]),
      );
    }

    if (dto.createdAtFrom || dto.createdAtTo) {
      const createdAtFilter = createDateRangeFilter(
        dto.createdAtFrom,
        dto.createdAtTo,
      );
      if (createdAtFilter) filters.createdAt = createdAtFilter;
    }

    if (dto.birthDateFrom || dto.birthDateTo) {
      filters.birthDate = {};
      if (dto.birthDateFrom) filters.birthDate.$gte = dto.birthDateFrom;
      if (dto.birthDateTo) filters.birthDate.$lte = dto.birthDateTo;
    }

    if (dto.ageFrom || dto.ageTo) {
      filters.age = {};
      if (dto.ageFrom) filters.age.$gte = dto.ageFrom;
      if (dto.ageTo) filters.age.$lte = dto.ageTo;
    }

    if (dto.gender) filters.gender = dto.gender;

    const addRegexFilter = (field: string, value?: string) => {
      if (value?.trim()) {
        filters[field] = { $regex: value.trim(), $options: "i" };
      }
    };

    addRegexFilter("address", dto.address);
    addRegexFilter("otherAddress", dto.otherAddress);
    addRegexFilter("job", dto.job);
    addRegexFilter("otherJob", dto.otherJob);
    addRegexFilter("visitReason", dto.visitReason);
    addRegexFilter("otherVisitReason", dto.otherVisitReason);
    addRegexFilter("radiologyReport", dto.radiologyReport);
    addRegexFilter("otherRadiologyReport", dto.otherRadiologyReport);

    const pipeline: any[] = [
      { $match: filters },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const [registrations, totalCount, lastRegistration, pendingReportsCount] =
      await Promise.all([
        this.registrationsModel.aggregate(pipeline).exec(),
        this.registrationsModel.countDocuments(filters),
        this.registrationsModel.findOne().sort({ createdAt: -1 }).lean(),
        this.registrationsModel
          .countDocuments({ radiologyReport: "pending" })
          .lean(),
      ]);

    if (lastRegistration) {
      const idx = registrations.findIndex(
        (reg) => String(reg._id) === String(lastRegistration._id),
      );
      if (idx !== -1) {
        registrations[idx] = {
          ...registrations[idx],
          isDeletable: true,
        };
      }
    }

    return {
      data: registrations,
      totalPagesCount: Math.ceil(totalCount / limit),
      totalCount,
      page,
      limit,
      pendingReportsCount,
    };
  }

  //
  // fullName: string;
  // birthYear: string;
  // gender: 'male' | 'female';
  // medicalHistoryNumber: string;
  // region: string;
  // district: string;
  // address: string;
  // operationStartDateTime: string;
  // operationEndDateTime: string;
  // preOperationDiagnosis: string;
  // operationName: string;
  // postOperationDiagnosis: string;
  // operationParticipants: string[];
  // phone: string;
  

  async createRegistration(
    createRegistrationDto: CreateRegistrationDto & {
      age?: number;
      yearlyCount?: number;
      radiologyFilmNumber?: number;
      participants?: UserProfile[];
      createdBy?: UserProfile;
    },
    user: UserProfile,
  ): Promise<{ totalCount: number; totalPagesCount: number }> {
    try {
      if (createRegistrationDto.birthYear) {
        createRegistrationDto.age = await getAgeHelper(
          createRegistrationDto.birthYear,
        );
      }

      createRegistrationDto.createdBy = user

      const [countDocuments, lastRegistration] = await Promise.all([
        this.registrationsModel.countDocuments(),
        this.registrationsModel.findOne().sort({ createdAt: -1 }).lean(),
      ]);

      if (countDocuments && lastRegistration) {
        const currentYear = new Date().getFullYear();
        if (
          new Date(Object(lastRegistration).createdAt).getFullYear() ===
          currentYear
        ) {
          createRegistrationDto.yearlyCount =
            (lastRegistration.yearlyCount || 0) + 1;
        } else {
          createRegistrationDto.yearlyCount = 1;
        }
      }

      if (createRegistrationDto.operationParticipants.length) {
        const participants = await getUsersByUserIds(createRegistrationDto.operationParticipants);
        createRegistrationDto.participants = participants;
      }

      await this.registrationsModel.create(createRegistrationDto);
      const countRegistrationDocuments =
        await this.registrationsModel.countDocuments();
      // this.backupService.handleCron()
      return {
        totalPagesCount: Math.ceil(countRegistrationDocuments / 20),
        totalCount: countRegistrationDocuments,
      };
    } catch (err) {
      console.log(err.message);
      throw new BadRequestException("Error in createRegistration", err.message);
    }
  }

  async updateRegistration(updateRegistrationDto: UpdateRegistrationDto & { age?: number, participants?: UserProfile[]}) {
    try {
      const findRegistrationData = await this.registrationsModel.findById(
        updateRegistrationDto.id,
      );

      if (!findRegistrationData) {
        throw new NotFoundException("Registration data not found");
      }

      if (updateRegistrationDto.birthYear) {
        updateRegistrationDto.age =
          new Date().getFullYear() - parseInt(updateRegistrationDto.birthYear, 10);
      }

      await this.registrationsModel.findByIdAndUpdate(
        updateRegistrationDto.id,
        updateRegistrationDto,
      );

      const countDocuments = await this.registrationsModel.countDocuments();
      if (updateRegistrationDto.operationParticipants.length) {
        const participants = await getUsersByUserIds(updateRegistrationDto.operationParticipants);
        updateRegistrationDto.participants = participants;
      }
      // this.backupService.handleCron()

      return {
        totalPagesCount: Math.ceil(countDocuments / 20),
        totalCount: countDocuments,
      };
    } catch (err) {
      console.error(err);
      throw new BadRequestException("Error in updateRegistration", err.message);
    }
  }

  async deleteRegistration(id: string) {
    try {
      const findRegistrationData = await this.registrationsModel.findById(id);

      if (!findRegistrationData) {
        throw new NotFoundException("Registration data not found");
      }

      await this.registrationsModel.findByIdAndDelete(id);
      const countDocuments = await this.registrationsModel.countDocuments();
      // this.backupService.handleCron()

      return {
        totalPagesCount: Math.ceil(countDocuments / 20),
        totalCount: countDocuments,
      };
    } catch (err) {
      console.error("Error in deleteRegistration", err.message);
      throw new BadRequestException({
        success: false,
        message: err.message,
      });
    }
  }
}
