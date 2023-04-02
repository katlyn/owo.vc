-- CreateEnum
CREATE TYPE "MetadataHandling" AS ENUM ('OWOIFY', 'PROXY', 'IGNORE');

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "metadata" "MetadataHandling" NOT NULL DEFAULT 'IGNORE';
