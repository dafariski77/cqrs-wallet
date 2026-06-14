import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UserWalletServiceModule } from './user-wallet-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserWalletServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: Number(process.env.USER_WALLET_SERVICE_PORT) || 3001,
      },
    },
  );
  await app.listen();
  console.log('User & Wallet Service is running on port 3001');
}
bootstrap();
