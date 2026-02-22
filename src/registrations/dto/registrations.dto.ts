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

  @IsOptional()
  @IsString()
  birthDateFrom?: string;

  @IsOptional()
  @IsString()
  birthDateTo?: string;

  @IsOptional()
  @IsNumber()
  ageFrom?: string;

  @IsOptional()
  @IsNumber()
  ageTo?: string;

  @IsOptional()
  @IsDateString()
  createdAtFrom?: string;

  @IsOptional()
  @IsDateString()
  createdAtTo?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  otherAddress?: string;

  @IsOptional()
  @IsString()
  job?: string;

  @IsOptional()
  @IsString()
  otherJob?: string;

  @IsOptional()
  @IsString()
  visitReason?: string;

  @IsOptional()
  @IsString()
  otherVisitReason?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: string;

  @IsOptional()
  @IsString()
  radiologyReport: string;

  @IsOptional()
  @IsString()
  otherRadiologyReport: string;
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
