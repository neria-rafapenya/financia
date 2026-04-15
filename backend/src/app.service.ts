import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AppStatus {
  name: string;
  status: 'ok';
  environment: string;
  apiPrefix: string;
  modules: string[];
}

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getStatus(): AppStatus {
    return {
      name: this.configService.getOrThrow<string>('APP_NAME'),
      status: 'ok',
      environment: this.configService.getOrThrow<string>('NODE_ENV'),
      apiPrefix: this.configService.getOrThrow<string>('API_PREFIX'),
      modules: [
        'auth',
        'users',
        'payers',
        'incomes',
        'expenses',
        'recurring-payments',
        'documents',
        'contracts',
        'tax',
        'alerts',
        'simulations',
        'ocr',
        'llm',
        'rules',
      ],
    };
  }
}
