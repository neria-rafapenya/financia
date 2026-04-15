import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function setupApp(app: INestApplication) {
  const configService = app.get(ConfigService);

  app.setGlobalPrefix(configService.get<string>('API_PREFIX', 'api'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  return app;
}
