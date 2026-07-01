ALTER TABLE "ProductCollection"
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "publishedAt" TIMESTAMP(3);

CREATE INDEX "ProductCollection_published_displayOrder_idx"
  ON "ProductCollection"("published", "displayOrder");
