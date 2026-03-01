import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { Gender } from "../schemas/registrations.schema";
import { RegistrationOptionTypeEnum } from "src/type/enums/options.enum";

export class AuthDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class ContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsString()
  @IsNotEmpty()
  tgOrPhone: string;
}



export class ForGenerateWordDto {
  @IsOptional()
  @IsDateString()
  createdAtFrom?: string;

  @IsOptional()
  @IsDateString()
  createdAtTo?: string;
}

export class GetFilteredRegistrationsDto {
  @IsOptional()
  @IsNumber()
  page: number;

  @IsOptional()
  @IsNumber()
  limit: number;

  @IsOptional()
  @IsString()
  search?: string;

  // Date range filters
  @IsOptional()
  @IsDateString()
  createdAtFrom?: string;

  @IsOptional()
  @IsDateString()
  createdAtTo?: string;

  @IsOptional()
  @IsDateString()
  operationStartDateTimeFrom?: string;

  @IsOptional()
  @IsDateString()
  operationStartDateTimeTo?: string;

  @IsOptional()
  @IsDateString()
  operationEndDateTimeFrom?: string;

  @IsOptional()
  @IsDateString()
  operationEndDateTimeTo?: string;

  // Birth year range (e.g. "1980" to "2000")
  @IsOptional()
  @IsString()
  birthYearFrom?: string;

  @IsOptional()
  @IsString()
  birthYearTo?: string;

  // Age range
  @IsOptional()
  @IsNumber()
  ageFrom?: number;

  @IsOptional()
  @IsNumber()
  ageTo?: number;

  // Exact match filters
  @IsOptional()
  @IsEnum(Gender)
  gender?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  district?: string;

  // Regex (partial match) filters
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  medicalHistoryNumber?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  preOperationDiagnosis?: string;

  @IsOptional()
  @IsString()
  operationName?: string;

  @IsOptional()
  @IsString()
  postOperationDiagnosis?: string;
}

export class ReportDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

// Create DTO: fullName, birthYear, gender, medicalHistoryNumber, region, district, address, operation*, phone
export class CreateRegistrationDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 4, { message: 'birthYear must be 4 digits (e.g. 1990)' })
  birthYear: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsString()
  @IsOptional()
  medicalHistoryNumber?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsDateString()
  @IsOptional()
  operationStartDateTime?: string;

  @IsDateString()
  @IsOptional()
  operationEndDateTime?: string;

  @IsString()
  @IsOptional()
  preOperationDiagnosis?: string;

  @IsString()
  @IsOptional()
  operationName?: string;

  @IsString()
  @IsOptional()
  postOperationDiagnosis?: string;

  @IsArray()
  @IsString({ each: true })
  operationParticipants?: string[];

  @IsString()
  @IsOptional()
  phone?: string;
}

// Update DTO: same fields, all optional except id
export class UpdateRegistrationDto {
  @IsMongoId()
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @Length(4, 4, { message: 'birthYear must be 4 digits (e.g. 1990)' })
  @IsOptional()
  birthYear?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  medicalHistoryNumber?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsDateString()
  @IsOptional()
  operationStartDateTime?: string;

  @IsDateString()
  @IsOptional()
  operationEndDateTime?: string;

  @IsString()
  @IsOptional()
  preOperationDiagnosis?: string;

  @IsString()
  @IsOptional()
  operationName?: string;

  @IsString()
  @IsOptional()
  postOperationDiagnosis?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  operationParticipants?: string[];

  @IsString()
  @IsOptional()
  phone?: string;
}

export class DeleteRegistrationDto {
  @IsMongoId()
  @IsString()
  id: string;
}



export class GetRegistrationOptionsDto {
  @IsEnum(RegistrationOptionTypeEnum)
  type: RegistrationOptionTypeEnum;
}

export class CreateRegistrationOptionDto {
  @IsEnum(RegistrationOptionTypeEnum)
  type: RegistrationOptionTypeEnum;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}
