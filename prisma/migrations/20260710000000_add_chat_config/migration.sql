-- CreateTable
CREATE TABLE "chat_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "models" TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_config_pkey" PRIMARY KEY ("id")
);
