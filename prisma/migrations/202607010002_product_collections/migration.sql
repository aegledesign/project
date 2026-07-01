CREATE TABLE "ProductCollection" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "CollectionProduct" (
  "collectionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("collectionId", "productId"),
  CONSTRAINT "CollectionProduct_collectionId_fkey"
    FOREIGN KEY ("collectionId") REFERENCES "ProductCollection"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CollectionProduct_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CollectionProduct_productId_idx" ON "CollectionProduct"("productId");
