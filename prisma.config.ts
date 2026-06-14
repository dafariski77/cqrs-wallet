import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'apps/user-wallet-service/prisma/schema.prisma',
  datasource: {
    provider: 'postgresql',
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/wallet_db?schema=public',
  },
});
