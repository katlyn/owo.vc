-- CreateTable
CREATE TABLE "BlockedDomain" (
    "domain" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "BlockedDomain_pkey" PRIMARY KEY ("domain")
);
