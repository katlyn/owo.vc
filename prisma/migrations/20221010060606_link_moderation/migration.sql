/*
  Warnings:

  - A unique constraint covering the columns `[commentId]` on the table `Link` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "commentId" TEXT,
ADD COLUMN     "status" "LinkStatus" NOT NULL DEFAULT E'ACTIVE';

-- CreateTable
CREATE TABLE "LinkComments" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "LinkComments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Link_commentId_key" ON "Link"("commentId");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "LinkComments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
