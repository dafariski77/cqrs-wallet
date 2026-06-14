import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { IndexerController } from './indexer.controller';
import { SyncProcessor } from './processors/sync.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'blockchain-sync',
    }),
    ClientsModule.register([
      {
        name: 'RABBITMQ_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
          ],
          queue: 'analytics_events',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [IndexerController],
  providers: [SyncProcessor],
})
export class IndexerServiceModule {}
