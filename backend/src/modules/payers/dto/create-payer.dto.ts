import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

const payerTypes = ['EMPLOYER', 'CLIENT', 'PUBLIC_BODY', 'OTHER'] as const;

export class CreatePayerDto {
  @IsString()
  @MinLength(2)
  payerName!: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsEnum(payerTypes)
  payerType!: (typeof payerTypes)[number];

  @IsOptional()
  @IsString()
  notes?: string;
}
