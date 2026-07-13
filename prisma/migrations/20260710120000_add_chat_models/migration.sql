-- CreateTable
CREATE TABLE "chat_models" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "lab" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "user_selectable" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_models_pkey" PRIMARY KEY ("id")
);
