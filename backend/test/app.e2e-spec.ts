import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { setupApp } from './../src/setup-app';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = setupApp(moduleFixture.createNestApplication());
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer() as Parameters<typeof request>[0])
      .get('/api')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          name: 'FINANCIA',
          status: 'ok',
          environment: 'test',
          apiPrefix: 'api',
        });
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
