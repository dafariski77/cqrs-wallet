import { Controller, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AddWalletCommand } from './commands/add-wallet.command';
import { AddWalletDto, ADD_WALLET_CMD } from '@shared/index';

@Controller()
export class UserWalletServiceController {
  private readonly logger = new Logger(UserWalletServiceController.name);

  constructor(private readonly commandBus: CommandBus) {}

  @MessagePattern(ADD_WALLET_CMD)
  async addWallet(@Payload() dto: AddWalletDto) {
    this.logger.log(
      `Received add_wallet command for userId=${dto.userId}, address=${dto.address}`,
    );
    const command = new AddWalletCommand(dto.userId, dto.address, dto.chainType);
    return this.commandBus.execute(command);
  }
}
