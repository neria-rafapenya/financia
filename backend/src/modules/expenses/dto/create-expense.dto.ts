import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

const sourceTypes = ['MANUAL', 'OCR', 'LLM', 'IMPORT'] as const;
const deductibilityStatuses = [
  'DEDUCTIBLE',
  'NON_DEDUCTIBLE',
  'REVIEWABLE',
  'UNKNOWN',
] as const;

export class CreateExpenseDto {
  @IsOptional()
  @IsNumber()
  categoryId?: number | null;

  @IsOptional()
  @IsNumber()
  payerId?: number | null;

  @IsDateString()
  expenseDate!: string;

  @IsString()
  concept!: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  amount!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  vatAmount?: number | null;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(sourceTypes)
  sourceType?: (typeof sourceTypes)[number];

  @IsOptional()
  @IsEnum(deductibilityStatuses)
  deductibilityStatus?: (typeof deductibilityStatuses)[number];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  businessUsePercent?: number | null;

  @IsOptional()
  @IsString()
  notes?: string;
}
