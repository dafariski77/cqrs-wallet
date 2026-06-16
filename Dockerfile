# Base image
FROM node:22-alpine AS base
WORKDIR /usr/src/app

# Install dependencies and build
FROM base AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
# We also need prisma schema early to generate the client
COPY apps/user-wallet-service/prisma ./apps/user-wallet-service/prisma

# Install ALL dependencies (including dev for building)
RUN npm install

# Copy the rest of the monorepo source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate --schema=./apps/user-wallet-service/prisma/schema.prisma

# Build all microservices
RUN npm run build:all

# Production image
FROM base AS runner

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copy only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy prisma schema to generate client for production
COPY apps/user-wallet-service/prisma ./apps/user-wallet-service/prisma
COPY prisma.config.ts ./
RUN npx prisma generate --schema=./apps/user-wallet-service/prisma/schema.prisma

# Copy built artifacts from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Create a start script to launch the specific app
RUN echo '#!/bin/sh' > /usr/src/app/start.sh && \
    echo 'set -e' >> /usr/src/app/start.sh && \
    echo 'if [ -z "$APP_NAME" ]; then echo "APP_NAME is not set"; exit 1; fi' >> /usr/src/app/start.sh && \
    echo 'if [ "$APP_NAME" = "user-wallet-service" ] && [ "$RUN_MIGRATIONS" = "true" ]; then' >> /usr/src/app/start.sh && \
    echo '  echo "Waiting for postgres to be ready..."' >> /usr/src/app/start.sh && \
    echo '  until nc -z postgres 5432; do' >> /usr/src/app/start.sh && \
    echo '    sleep 1' >> /usr/src/app/start.sh && \
    echo '  done' >> /usr/src/app/start.sh && \
    echo '  echo "Postgres is ready! Running Prisma Migrations..."' >> /usr/src/app/start.sh && \
    echo '  npx prisma migrate deploy --schema=./apps/user-wallet-service/prisma/schema.prisma' >> /usr/src/app/start.sh && \
    echo 'fi' >> /usr/src/app/start.sh && \
    echo 'echo "Starting $APP_NAME..."' >> /usr/src/app/start.sh && \
    echo 'node dist/apps/$APP_NAME/main' >> /usr/src/app/start.sh && \
    chmod +x /usr/src/app/start.sh

CMD ["/usr/src/app/start.sh"]
