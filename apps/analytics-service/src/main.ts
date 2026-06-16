import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AnalyticsServiceModule } from './analytics-service.module';

async function bootstrap() {
  const app = await NestFactory.create(AnalyticsServiceModule);

  // Connect to RabbitMQ as a microservice consumer
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [
        process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
      ],
      queue: 'analytics_events',
      queueOptions: {
        durable: true,
      },
      noAck: false,
    },
  });

  // Also expose TCP for synchronous queries from Gateway
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: Number(process.env.ANALYTICS_SERVICE_PORT) || 3007,
    },
  });

  await app.startAllMicroservices();
  console.log('Analytics Service is running (RabbitMQ + TCP port 3007)');
}
bootstrap();
