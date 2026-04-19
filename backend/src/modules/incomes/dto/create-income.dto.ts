import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const incomeTypes = [
  'PAYSLIP',
  'BONUS',
  'FREELANCE_INVOICE',
  'RETENTION_CERTIFICATE',
  'OTHER',
] as const;

export class CreateIncomeDto {
  @IsInt()
  payerId!: number;

  @IsOptional()
  @IsInt()
  contractId?: number | null;

  @IsEnum(incomeTypes)
  incomeType!: (typeof incomeTypes)[number];

  @IsInt()
  periodYear!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth?: number | null;

  @IsNumber({ maxDecimalPlaces: 2 })
  grossAmount!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  netAmount?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  irpfWithheld?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  socialSecurityAmount?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  flexibleCompensationAmount?: number | null;

  @IsOptional()
  @IsString()
  notes?: string;
}
