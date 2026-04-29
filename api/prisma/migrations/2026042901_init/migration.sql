-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('expense', 'income');

-- CreateEnum
CREATE TYPE "Account" AS ENUM ('efectivo', 'banco', 'tarjeta_credito');

-- CreateTable
CREATE TABLE "allowed_users" (
    "id" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allowed_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movements" (
    "id" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" TEXT NOT NULL,
    "account" "Account" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "allowed_users_telegramUserId_key" ON "allowed_users"("telegramUserId");

-- CreateIndex
CREATE INDEX "movements_telegramUserId_idx" ON "movements"("telegramUserId");

-- CreateIndex
CREATE INDEX "movements_createdAt_idx" ON "movements"("createdAt");

-- CreateIndex
CREATE INDEX "movements_telegramUserId_createdAt_idx" ON "movements"("telegramUserId", "createdAt");

