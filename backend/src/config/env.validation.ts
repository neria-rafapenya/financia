import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
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
  CLOUDINARY_CLOUD_NAME: '',
  CLOUDINARY_API_KEY: '',
  CLOUDINARY_API_SECRET: '',
  CLOUDINARY_FOLDER: 'gestor-financia-ai',
  OCR_PROVIDER: 'tesseract',
  LLM_PROVIDER: 'mock',
  LLM_MODEL: 'local-dev',
  CORS_ALLOWED_ORIGINS: '',
  OPENAI_API_KEY: '',
  OPENAI_MODEL: 'gpt-4.1-mini',
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

  @IsIn(['local', 'cloudinary'])
  STORAGE_DRIVER!: string;

  @IsString()
  @IsNotEmpty()
  STORAGE_LOCAL_PATH!: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_CLOUD_NAME?: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_API_KEY?: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_API_SECRET?: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_FOLDER?: string;

  @IsString()
  @IsNotEmpty()
  OCR_PROVIDER!: string;

  @IsString()
  @IsNotEmpty()
  LLM_PROVIDER!: string;

  @IsString()
  @IsNotEmpty()
  LLM_MODEL!: string;

  @IsOptional()
  @IsString()
  CORS_ALLOWED_ORIGINS?: string;

  @IsOptional()
  @IsString()
  OPENAI_API_KEY?: string;

  @IsOptional()
  @IsString()
  OPENAI_MODEL?: string;
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

  if (validatedConfig.STORAGE_DRIVER === 'cloudinary') {
    const missingFields = [
      ['CLOUDINARY_CLOUD_NAME', validatedConfig.CLOUDINARY_CLOUD_NAME],
      ['CLOUDINARY_API_KEY', validatedConfig.CLOUDINARY_API_KEY],
      ['CLOUDINARY_API_SECRET', validatedConfig.CLOUDINARY_API_SECRET],
    ].filter(([, value]) => !value?.trim());

    if (missingFields.length > 0) {
      throw new Error(
        `Invalid environment configuration: ${missingFields
          .map(([field]) => field)
          .join(
            ', ',
          )} ${missingFields.length === 1 ? 'is' : 'are'} required when STORAGE_DRIVER=cloudinary`,
      );
    }
  }

  return validatedConfig;
}
