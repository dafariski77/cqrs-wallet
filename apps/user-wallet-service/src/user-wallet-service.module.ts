import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserWalletServiceController } from './user-wallet-service.controller';
import { PrismaService } from './prisma.service';
import { AddWalletHandler } from './commands/add-wallet.handler';

@Module({
  imports: [
    CqrsModule,
    ClientsModule.register([
      {
        name: 'RABBITMQ_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
          queue: 'wallet_events',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [UserWalletServiceController],
  providers: [PrismaService, AddWalletHandler],
})
export class UserWalletServiceModule {}
