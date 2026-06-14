import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { IndexerServiceModule } from './indexer-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    IndexerServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
        ],
        queue: 'wallet_events',
        queueOptions: {
          durable: true,
        },
        noAck: false,
      },
    },
  );
  await app.listen();
  console.log('Indexer Service is listening to RabbitMQ...');
}
bootstrap();
