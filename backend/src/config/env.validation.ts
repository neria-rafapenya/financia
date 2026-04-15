import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

const defaultEnv = {
  NODE_ENV: 'development',
  PORT: '3000',
  API_PREFIX: 'api',
  APP_NAME: 'FINANCIA',
  JWT_ACCESS_SECRET: 'financia-local-access-secret-change-before-production',
  JWT_REFRESH_SECRET: 'financia-local-refresh-secret-change-before-production',
  JWT_ACCESS_TTL: '900',
  JWT_REFRESH_TTL: '2592000',
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_NAME: 'financia',
  DB_USER: 'root',
  DB_PASSWORD: 'financia_local_dev_password_change_me',
  STORAGE_DRIVER: 'local',
  STORAGE_LOCAL_PATH: 'storage',
  OCR_PROVIDER: 'tesseract',
  LLM_PROVIDER: 'mock',
  LLM_MODEL: 'local-dev',
};

class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  API_PREFIX!: string;

  @IsString()
  @IsNotEmpty()
  APP_NAME!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsInt()
  @Min(60)
  JWT_ACCESS_TTL!: number;

  @IsInt()
  @Min(3600)
  JWT_REFRESH_TTL!: number;

  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT!: number;

  @IsString()
  @IsNotEmpty()
  DB_NAME!: string;

  @IsString()
  @IsNotEmpty()
  DB_USER!: string;

  @IsString()
  DB_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  STORAGE_DRIVER!: string;

  @IsString()
  @IsNotEmpty()
  STORAGE_LOCAL_PATH!: string;

  @IsString()
  @IsNotEmpty()
  OCR_PROVIDER!: string;

  @IsString()
  @IsNotEmpty()
  LLM_PROVIDER!: string;

  @IsString()
  @IsNotEmpty()
  LLM_MODEL!: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    { ...defaultEnv, ...config },
    {
      enableImplicitConversion: true,
    },
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const formattedErrors = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join(', ');

    throw new Error(`Invalid environment configuration: ${formattedErrors}`);
  }

  return validatedConfig;
}
