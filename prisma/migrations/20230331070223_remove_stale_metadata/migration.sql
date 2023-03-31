/*
  Warnings:

  - You are about to drop the column `owoify` on the `Link` table. All the data in the column will be lost.
  - You are about to drop the column `preventScrape` on the `Link` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Link" DROP COLUMN "owoify",
DROP COLUMN "preventScrape";
