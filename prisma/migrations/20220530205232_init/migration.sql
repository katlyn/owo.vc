-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "preventScrape" BOOLEAN NOT NULL DEFAULT false,
    "owoify" BOOLEAN NOT NULL DEFAULT false,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "scrapes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);
