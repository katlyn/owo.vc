-- CreateTable
CREATE TABLE "BlockedDomains" (
    "domain" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "BlockedDomains_pkey" PRIMARY KEY ("domain")
);
