import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

const contractTypes = [
  'EMPLOYMENT',
  'FREELANCE',
  'RENTAL',
  'INSURANCE',
  'OTHER',
] as const;
const workdayTypes = ['FULL_TIME', 'PART_TIME', 'OTHER'] as const;
const statuses = ['ACTIVE', 'INACTIVE', 'EXPIRED', 'DRAFT'] as const;

export class CreateContractDto {
  @IsOptional()
  @IsNumber()
  payerId?: number | null;

  @IsEnum(contractTypes)
  contractType!: (typeof contractTypes)[number];

  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  grossSalaryMonthly?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  netSalaryMonthly?: number | null;

  @IsOptional()
  @IsBoolean()
  exclusivityFlag?: boolean;

  @IsOptional()
  @IsBoolean()
  nonCompeteFlag?: boolean;

  @IsOptional()
  @IsEnum(workdayTypes)
  workdayType?: (typeof workdayTypes)[number] | null;

  @IsOptional()
  @IsEnum(statuses)
  status?: (typeof statuses)[number];

  @IsOptional()
  @IsString()
  notes?: string;
}
