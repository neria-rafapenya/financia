import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true';
  }

  return value;
}

export class ProcessLlmDto {
  @IsOptional()
  @IsString()
  rawResponse?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ocrResultId?: number | null;

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
  @IsObject()
  parsedJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  confidenceSummary?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  autoDetectDocumentType?: boolean;
}
