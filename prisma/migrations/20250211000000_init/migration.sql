-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telegram_id" INTEGER NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "current_state" TEXT NOT NULL DEFAULT 'idle',
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_info" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "state_data" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "user_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE INDEX "users_telegram_id_idx" ON "users"("telegram_id");

-- CreateIndex
CREATE INDEX "users_current_state_idx" ON "users"("current_state");

-- CreateIndex
CREATE UNIQUE INDEX "user_info_user_id_key" ON "user_info"("user_id");

-- CreateIndex
CREATE INDEX "user_info_user_id_idx" ON "user_info"("user_id");
