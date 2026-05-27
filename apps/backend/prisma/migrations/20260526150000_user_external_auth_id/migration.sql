ALTER TABLE "users" ADD COLUMN "externalAuthId" TEXT;

CREATE UNIQUE INDEX "users_externalAuthId_key" ON "users"("externalAuthId");
