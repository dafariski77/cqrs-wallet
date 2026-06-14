import { Test, TestingModule } from '@nestjs/testing';
import { IndexerServiceController } from './indexer-service.controller';
import { IndexerServiceService } from './indexer-service.service';

describe('IndexerServiceController', () => {
  let indexerServiceController: IndexerServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [IndexerServiceController],
      providers: [IndexerServiceService],
    }).compile();

    indexerServiceController = app.get<IndexerServiceController>(IndexerServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(indexerServiceController.getHello()).toBe('Hello World!');
    });
  });
});
