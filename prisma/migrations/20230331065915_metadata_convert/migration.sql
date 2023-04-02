-- Convert values in preventScrape and owoify columns
UPDATE "Link" SET "metadata" = (CASE "preventScrape"
    WHEN TRUE THEN 'IGNORE'
    WHEN FALSE THEN (CASE "owoify"
        WHEN TRUE THEN 'OWOIFY'
        WHEN FALSE THEN 'PROXY'
    END)
END)::"MetadataHandling";

-- AlterTable
ALTER TABLE "Link" ALTER COLUMN "metadata" DROP DEFAULT;
