-- CreateEnum
CREATE TYPE "ShortenMethods" AS ENUM ('OWO_VC', 'ZWS', 'SKETCHY', 'GAY', 'NONE');

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "method" "ShortenMethods" NOT NULL DEFAULT 'NONE';
