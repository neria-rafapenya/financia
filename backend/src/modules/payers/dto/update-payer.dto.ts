import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

const payerTypes = ['EMPLOYER', 'CLIENT', 'PUBLIC_BODY', 'OTHER'] as const;

export class UpdatePayerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  payerName?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsEnum(payerTypes)
  payerType?: (typeof payerTypes)[number];

  @IsOptional()
  @IsString()
  notes?: string;
}
