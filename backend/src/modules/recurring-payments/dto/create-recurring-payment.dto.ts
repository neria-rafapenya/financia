import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

const frequencies = ['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'YEARLY'] as const;
const deductibilityStatuses = [
  'DEDUCTIBLE',
  'NON_DEDUCTIBLE',
  'REVIEWABLE',
  'UNKNOWN',
] as const;

export class CreateRecurringPaymentDto {
  @IsOptional()
  @IsNumber()
  categoryId?: number | null;

  @IsString()
  title!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  amount!: number;

  @IsEnum(frequencies)
  frequency!: (typeof frequencies)[number];

  @IsDateString()
  nextDueDate!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(deductibilityStatuses)
  deductibilityStatus?: (typeof deductibilityStatuses)[number];

  @IsOptional()
  @IsString()
  notes?: string;
}
