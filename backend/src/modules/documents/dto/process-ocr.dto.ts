import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ProcessOcrDto {
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
}
