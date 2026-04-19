import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
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

export class UploadDocumentDto {
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
}
