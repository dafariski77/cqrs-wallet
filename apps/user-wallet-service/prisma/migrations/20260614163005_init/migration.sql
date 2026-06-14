-- CreateEnum
CREATE TYPE "ChainType" AS ENUM ('ETHEREUM', 'POLYGON', 'SOLANA');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "TransferDirection" AS ENUM ('IN', 'OUT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chain_type" "ChainType" NOT NULL,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "block_time" TIMESTAMP(3) NOT NULL,
    "fee" DECIMAL(65,30) NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_transfers" (
    "id" TEXT NOT NULL,
    "tx_id" TEXT NOT NULL,
    "token_mint" TEXT NOT NULL,
    "symbol" TEXT NOT NULL DEFAULT '',
    "amount" BIGINT NOT NULL,
    "direction" "TransferDirection" NOT NULL,

    CONSTRAINT "token_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_address_key" ON "wallets"("user_id", "address");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_signature_key" ON "transactions"("signature");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_transfers" ADD CONSTRAINT "token_transfers_tx_id_fkey" FOREIGN KEY ("tx_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
