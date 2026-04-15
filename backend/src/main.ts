import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

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

async function bootstrap() {
  const app = setupApp(await NestFactory.create(AppModule));
  await app.listen(app.get(ConfigService).get<number>('PORT', 3000));
}

void bootstrap();
