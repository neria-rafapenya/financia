import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const mockStatus = {
    name: 'FINANCIA',
    status: 'ok' as const,
    environment: 'test',
    apiPrefix: 'api',
    modules: ['auth'],
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getStatus: jest.fn().mockReturnValue(mockStatus),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return backend status metadata', () => {
      expect(appController.getStatus()).toEqual(mockStatus);
    });
  });
});
