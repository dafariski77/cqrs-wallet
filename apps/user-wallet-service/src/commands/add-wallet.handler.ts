import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AddWalletCommand } from './add-wallet.command';
import { PrismaService } from '../prisma.service';
import {
  WalletAddedEvent,
  WALLET_ADDED_ROUTING_KEY,
} from '@shared/index';

@CommandHandler(AddWalletCommand)
export class AddWalletHandler implements ICommandHandler<AddWalletCommand> {
  private readonly logger = new Logger(AddWalletHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('RABBITMQ_CLIENT') private readonly rmqClient: ClientProxy,
  ) {}

  async execute(command: AddWalletCommand) {
    const { userId, address, chainType } = command;

    this.logger.log(`Adding wallet ${address} for user ${userId}`);

    // Ensure user exists (upsert)
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    // Upsert wallet (avoid duplicate per user+address)
    const wallet = await this.prisma.wallet.upsert({
      where: { userId_address: { userId, address } },
      update: { syncStatus: 'PENDING' },
      create: {
        userId,
        address,
        chainType: chainType as any,
        syncStatus: 'PENDING',
      },
    });

    this.logger.log(`Wallet saved: ${wallet.id}`);

    // Publish WalletAddedEvent to RabbitMQ
    const event = new WalletAddedEvent(userId, wallet.id, address, chainType);
    this.rmqClient.emit(WALLET_ADDED_ROUTING_KEY, event);

    this.logger.log(
      `Published ${WALLET_ADDED_ROUTING_KEY} event for wallet ${wallet.id}`,
    );

    return {
      walletId: wallet.id,
      address: wallet.address,
      chainType: wallet.chainType,
      syncStatus: wallet.syncStatus,
    };
  }
}
