import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

const documentTypes = [
  'PAYSLIP',
  'RETENTION_CERTIFICATE',
  'CONTRACT',
  'INVOICE',
  'RECEIPT',
  'RENTAL_DOCUMENT',
  'INSURANCE_DOCUMENT',
  'TAX_DOCUMENT',
  'SCREENSHOT',
  'OTHER',
] as const;

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true';
  }

  return value;
}

export class ProcessDocumentPipelineDto {
  @IsOptional()
  @IsEnum(documentTypes)
  documentType?: (typeof documentTypes)[number];

  @IsOptional()
  @IsDateString()
  documentDate?: string;

  @IsOptional()
  @IsString()
  linkedEntityType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  linkedEntityId?: number | null;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 90, 180, 270])
  manualRotationDegrees?: number;

  @IsOptional()
  @IsString()
  ocrProvider?: string;

  @IsOptional()
  @IsString()
  rawText?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  confidenceScore?: number | null;

  @IsOptional()
  @IsString()
  llmProvider?: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsString()
  promptVersion?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  autoDetectDocumentType?: boolean;
}
