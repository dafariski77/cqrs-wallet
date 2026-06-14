import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  const port = Number(process.env.GATEWAY_PORT) || 3000;
  await app.listen(port);
  console.log(`API Gateway is running on http://localhost:${port}/api/v1`);
}
bootstrap();
