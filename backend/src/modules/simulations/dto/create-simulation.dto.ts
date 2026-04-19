import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

const simulationTypes = [
  'NEW_JOB',
  'RETENTION_CHANGE',
  'FREELANCE_PERIOD',
  'NEW_RECURRING_COST',
  'CUSTOM',
] as const;

export class CreateSimulationDto {
  @IsString()
  title!: string;

  @IsEnum(simulationTypes)
  simulationType!: (typeof simulationTypes)[number];

  @IsObject()
  inputPayload!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  resultPayload?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  notes?: string;
}
