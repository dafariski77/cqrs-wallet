import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GatewayController } from './gateway.controller';
import { USER_WALLET_SERVICE, ANALYTICS_SERVICE } from '@shared/index';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: USER_WALLET_SERVICE,
        transport: Transport.TCP,
        options: {
          host: process.env.USER_WALLET_SERVICE_HOST || 'localhost',
          port: Number(process.env.USER_WALLET_SERVICE_PORT) || 3006,
        },
      },
      {
        name: ANALYTICS_SERVICE,
        transport: Transport.TCP,
        options: {
          host: process.env.ANALYTICS_SERVICE_HOST || 'localhost',
          port: Number(process.env.ANALYTICS_SERVICE_PORT) || 3007,
        },
      },
    ]),
  ],
  controllers: [GatewayController],
})
export class GatewayModule {}
