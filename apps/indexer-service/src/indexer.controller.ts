import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { Queue } from 'bullmq';
import { WalletAddedEvent, WALLET_ADDED_ROUTING_KEY } from '@shared/index';

@Controller()
export class IndexerController {
  private readonly logger = new Logger(IndexerController.name);

  constructor(
    @InjectQueue('blockchain-sync') private readonly syncQueue: Queue,
  ) {}

  @EventPattern(WALLET_ADDED_ROUTING_KEY)
  async handleWalletAdded(
    @Payload() event: WalletAddedEvent,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Received wallet.added event for wallet ${event.walletId} (${event.address})`,
    );

    // Add a BullMQ job to fetch transactions asynchronously
    await this.syncQueue.add(
      'sync-wallet',
      {
        userId: event.userId,
        walletId: event.walletId,
        address: event.address,
        chainType: event.chainType,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Queued sync job for wallet ${event.walletId}`);

    // Acknowledge the message
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
}
