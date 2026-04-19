import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

const sources = ['OCR', 'LLM', 'RULE', 'MANUAL'] as const;
const confidenceLevels = ['HIGH', 'MEDIUM', 'LOW'] as const;

export class VerifyDocumentFieldDto {
  @IsString()
  fieldName!: string;

  @IsOptional()
  @IsString()
  fieldValue?: string | null;

  @IsEnum(sources)
  source!: (typeof sources)[number];

  @IsEnum(confidenceLevels)
  confidenceLevel!: (typeof confidenceLevels)[number];

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

export class VerifyDocumentDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerifyDocumentFieldDto)
  fieldValues?: VerifyDocumentFieldDto[];
}
