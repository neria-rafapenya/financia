import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function setupApp(app: INestApplication) {
  const configService = app.get(ConfigService);
  const corsAllowedOrigins = configService
    .get<string>('CORS_ALLOWED_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix(configService.get<string>('API_PREFIX', 'api'));
  app.enableCors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || corsAllowedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      callback(null, corsAllowedOrigins.includes(origin));
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  return app;
}
