import { Test, TestingModule } from '@nestjs/testing';
import { UserWalletServiceController } from './user-wallet-service.controller';
import { UserWalletServiceService } from './user-wallet-service.service';

describe('UserWalletServiceController', () => {
  let userWalletServiceController: UserWalletServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserWalletServiceController],
      providers: [UserWalletServiceService],
    }).compile();

    userWalletServiceController = app.get<UserWalletServiceController>(UserWalletServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(userWalletServiceController.getHello()).toBe('Hello World!');
    });
  });
});
