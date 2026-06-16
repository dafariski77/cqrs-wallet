import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  const port = Number(process.env.GATEWAY_PORT) || 3005;
  await app.listen(port);
  console.log(`Gateway is running on http://localhost:3005/api/v1`);
}
bootstrap();
