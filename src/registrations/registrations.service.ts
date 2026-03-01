import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ConfigService } from "@nestjs/config";
import { createDateRangeFilter } from "src/helpers/dateRangeFilter.helper";
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
  CreateRegistrationDto,
  GetFilteredRegistrationsDto,
  UpdateRegistrationDto,
  ReportDto,
  ContactDto,
  CreateRegistrationOptionDto,
} from "./dto/registrations.dto";
import {
  Registrations,
  RegistrationsDocument,
} from "./schemas/registrations.schema";
import { RegistrationOptionTypeEnum } from "src/type/enums/options.enum";
import {
  RegistrationOption,
  RegistrationOptionDocument,
} from "./schemas/registration-option.schema";
import { buildReportPipeline } from "../helpers/build-report-pipeline.helper";
import { sendMessage } from "src/helpers/send-message";
import { UsersService } from "src/users/users.service";
import { UserProfile } from "src/type/interfaces/user.interface";
import { REGIONS_LIST } from "./data/regions-list.constant";
import { DistrictObj, RegionObj } from "src/type/interfaces/places.interface";
import { DISTRICTS_LIST } from "./data/districts-list.constant";
import { syncRegistrationOptions } from "./utils/syncRegistrationOptions";
import { ParticipantsService } from "src/participants/participants.service";

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectModel(Registrations.name)
    private readonly registrationsModel: Model<RegistrationsDocument>,
    @InjectModel(RegistrationOption.name)
    private readonly registrationOptionModel: Model<RegistrationOptionDocument>,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly participantsService: ParticipantsService,
    // private readonly backupService: BackupService
  ) { }

  async contact(contactDto: ContactDto) {
    const { name, tgOrPhone } = contactDto;
    const messageText = `🔔 Yangi xabar! \n\n👤 Ism: ${name}\n📱 Telegram/Telefon: ${tgOrPhone || "Ko'rsatilmagan"
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

    if (forGenerateWordDto.operationStartDateTimeFrom || forGenerateWordDto.operationStartDateTimeTo) {
      const operationStartFilter = createDateRangeFilter(
        forGenerateWordDto.operationStartDateTimeFrom,
        forGenerateWordDto.operationStartDateTimeTo,
      );
      if (operationStartFilter) filters.operationStartDateTime = operationStartFilter;
    }

    if (forGenerateWordDto.operationEndDateTimeFrom || forGenerateWordDto.operationEndDateTimeTo) {
      const operationEndFilter = createDateRangeFilter(
        forGenerateWordDto.operationEndDateTimeFrom,
        forGenerateWordDto.operationEndDateTimeTo,
      );
      if (operationEndFilter) filters.operationEndDateTime = operationEndFilter;
    }

    if (forGenerateWordDto.birthYearFrom || forGenerateWordDto.birthYearTo) {
      filters.birthYear = {};
      if (forGenerateWordDto.birthYearFrom)
        filters.birthYear.$gte = forGenerateWordDto.birthYearFrom;
      if (forGenerateWordDto.birthYearTo)
        filters.birthYear.$lte = forGenerateWordDto.birthYearTo;
    }

    if (forGenerateWordDto.ageFrom !== undefined || forGenerateWordDto.ageTo !== undefined) {
      filters.age = {};
      if (forGenerateWordDto.ageFrom !== undefined)
        filters.age.$gte = forGenerateWordDto.ageFrom;
      if (forGenerateWordDto.ageTo !== undefined)
        filters.age.$lte = forGenerateWordDto.ageTo;
    }

    if (forGenerateWordDto.gender) filters.gender = forGenerateWordDto.gender;
    if (forGenerateWordDto.region) filters.region = forGenerateWordDto.region;
    if (forGenerateWordDto.district) filters.district = forGenerateWordDto.district;

    const addRegexFilter = (field: string, value?: string) => {
      if (value?.trim()) {
        filters[field] = { $regex: value.trim(), $options: "i" };
      }
    };

    addRegexFilter("address", forGenerateWordDto.address);
    addRegexFilter("medicalHistoryNumber", forGenerateWordDto.medicalHistoryNumber);
    addRegexFilter("phone", forGenerateWordDto.phone);
    addRegexFilter("preOperationDiagnosis", forGenerateWordDto.preOperationDiagnosis);
    addRegexFilter("operationName", forGenerateWordDto.operationName);
    addRegexFilter("postOperationDiagnosis", forGenerateWordDto.postOperationDiagnosis);

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

    // Universal text search across relevant schema fields
    if (dto.search?.trim()) {
      Object.assign(
        filters,
        await universalSearchQuery(dto.search.trim(), [
          "fullName",
          "phone",
          "address",
          "medicalHistoryNumber",
          "preOperationDiagnosis",
          "operationName",
          "postOperationDiagnosis",
        ]),
      );
    }

    // Date range: createdAt
    if (dto.createdAtFrom || dto.createdAtTo) {
      const createdAtFilter = createDateRangeFilter(
        dto.createdAtFrom,
        dto.createdAtTo,
      );
      if (createdAtFilter) filters.createdAt = createdAtFilter;
    }

    // Date range: operationStartDateTime
    if (dto.operationStartDateTimeFrom || dto.operationStartDateTimeTo) {
      const operationStartFilter = createDateRangeFilter(
        dto.operationStartDateTimeFrom,
        dto.operationStartDateTimeTo,
      );
      if (operationStartFilter) filters.operationStartDateTime = operationStartFilter;
    }

    // Date range: operationEndDateTime
    if (dto.operationEndDateTimeFrom || dto.operationEndDateTimeTo) {
      const operationEndFilter = createDateRangeFilter(
        dto.operationEndDateTimeFrom,
        dto.operationEndDateTimeTo,
      );
      if (operationEndFilter) filters.operationEndDateTime = operationEndFilter;
    }

    // Birth year range (string comparison works for 4-digit years)
    if (dto.birthYearFrom || dto.birthYearTo) {
      filters.birthYear = {};
      if (dto.birthYearFrom) filters.birthYear.$gte = dto.birthYearFrom;
      if (dto.birthYearTo) filters.birthYear.$lte = dto.birthYearTo;
    }

    // Age range
    if (dto.ageFrom !== undefined || dto.ageTo !== undefined) {
      filters.age = {};
      if (dto.ageFrom !== undefined) filters.age.$gte = dto.ageFrom;
      if (dto.ageTo !== undefined) filters.age.$lte = dto.ageTo;
    }

    // Exact match filters
    if (dto.gender) filters.gender = dto.gender;
    if (dto.region) filters.region = dto.region;
    if (dto.district) filters.district = dto.district;

    // Regex (partial match) filters
    const addRegexFilter = (field: string, value?: string) => {
      if (value?.trim()) {
        filters[field] = { $regex: value.trim(), $options: "i" };
      }
    };

    addRegexFilter("address", dto.address);
    addRegexFilter("medicalHistoryNumber", dto.medicalHistoryNumber);
    addRegexFilter("phone", dto.phone);
    addRegexFilter("preOperationDiagnosis", dto.preOperationDiagnosis);
    addRegexFilter("operationName", dto.operationName);
    addRegexFilter("postOperationDiagnosis", dto.postOperationDiagnosis);

    const pipeline: any[] = [
      { $match: filters },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const [registrations, totalCount, lastRegistration] =
      await Promise.all([
        this.registrationsModel.aggregate(pipeline).exec(),
        this.registrationsModel.countDocuments(filters),
        this.registrationsModel.findOne().sort({ createdAt: -1 }).lean(),
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
    };
  }


  async getUsers() {
    try {
      const users = await this.usersService.getAllUsers();
      return users;
    } catch (err) {
      console.error(err);
      throw new BadRequestException("Error in getUsers", err.message);
    }
  }

  async getOptionsByType(type: RegistrationOptionTypeEnum) {
    try {
      const options = await this.registrationOptionModel.find({ type }).exec();
      return options;
    } catch (err) {
      console.error(err);
      throw new BadRequestException("Error in getOptionsByType", err.message);
    }
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
      regionObj?: RegionObj;
      districtObj?: DistrictObj;
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

      if (createRegistrationDto.operationParticipants?.length) {
        let participants = await this.usersService.getUsersByUserIds(createRegistrationDto.operationParticipants);
        if (!participants.length) {
          createRegistrationDto.participants = await this.participantsService.filterParticipants(createRegistrationDto.operationParticipants);
        } else {
          createRegistrationDto.participants = participants;
        }
      }


      if (createRegistrationDto.region) {
        const region = REGIONS_LIST.find(region => region.id === createRegistrationDto.region);
        if (region && region.id !== 'other') {
          createRegistrationDto.regionObj = region;
        }
      }

      if (createRegistrationDto.district) {
        const district = DISTRICTS_LIST.find(district => district.id === createRegistrationDto.district);
        if (district && district.id !== 'other') {
          createRegistrationDto.districtObj = district;
        }
      }

      syncRegistrationOptions(this.registrationOptionModel, {
        preOperationDiagnosis: createRegistrationDto.preOperationDiagnosis,
        operationName: createRegistrationDto.operationName,
        postOperationDiagnosis: createRegistrationDto.postOperationDiagnosis,
      });

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

  async updateRegistration(updateRegistrationDto: UpdateRegistrationDto & { age?: number, participants?: UserProfile[], regionObj?: RegionObj, districtObj?: DistrictObj }) {
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

      if (updateRegistrationDto.region) {
        const region = REGIONS_LIST.find(region => region.id === updateRegistrationDto.region);
        if (region && region.id !== 'other') {
          updateRegistrationDto.regionObj = region;
        }
      }

      if (updateRegistrationDto.district) {
        const district = DISTRICTS_LIST.find(district => district.id === updateRegistrationDto.district);
        if (district && district.id !== 'other') {
          updateRegistrationDto.districtObj = district;
        }
      }

     
      if (updateRegistrationDto.operationParticipants?.length) {
        let participants = await this.usersService.getUsersByUserIds(updateRegistrationDto.operationParticipants);
        if (!participants.length) {
          updateRegistrationDto.participants = await this.participantsService.filterParticipants(updateRegistrationDto.operationParticipants);
        } else {
          updateRegistrationDto.participants = participants;
        }
      }

      syncRegistrationOptions(this.registrationOptionModel, {
        preOperationDiagnosis: updateRegistrationDto.preOperationDiagnosis,
        operationName: updateRegistrationDto.operationName,
        postOperationDiagnosis: updateRegistrationDto.postOperationDiagnosis,
      });

      const updatedRegistration = await this.registrationsModel.findByIdAndUpdate(
        updateRegistrationDto.id,
        updateRegistrationDto,
        { returnDocument: 'after' },
      );
      const countDocuments = await this.registrationsModel.countDocuments();

      return {
        totalPagesCount: Math.ceil(countDocuments / 20),
        totalCount: countDocuments,
        updatedRegistration,
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
