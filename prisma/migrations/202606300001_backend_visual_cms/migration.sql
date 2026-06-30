CREATE TYPE "MockupView" AS ENUM ('FRONT', 'BACK', 'LEFT', 'RIGHT', 'DETAIL');
CREATE TYPE "NavigationLocation" AS ENUM ('HEADER', 'FOOTER');

CREATE TABLE "MediaAsset" (
  "id" TEXT PRIMARY KEY,
  "url" TEXT NOT NULL,
  "key" TEXT NOT NULL UNIQUE,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "altText" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "Product"
  DROP COLUMN IF EXISTS "hero",
  DROP COLUMN IF EXISTS "colors",
  DROP COLUMN IF EXISTS "printLocations",
  ALTER COLUMN "basePrice" TYPE DECIMAL(10,2);

CREATE TABLE "ProductVariant" (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "colorKey" TEXT NOT NULL,
  "colorName" TEXT NOT NULL,
  "hexColor" TEXT,
  "sku" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("productId", "colorKey")
);

CREATE TABLE "ProductMockup" (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "variantId" TEXT REFERENCES "ProductVariant"("id") ON DELETE SET NULL,
  "mediaAssetId" TEXT NOT NULL REFERENCES "MediaAsset"("id") ON DELETE RESTRICT,
  "view" "MockupView" NOT NULL,
  "colorKey" TEXT NOT NULL,
  "altText" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "ProductMockup_productId_colorKey_view_idx" ON "ProductMockup"("productId", "colorKey", "view");

CREATE TABLE "PrintArea" (
  "id" TEXT PRIMARY KEY,
  "mockupId" TEXT NOT NULL REFERENCES "ProductMockup"("id") ON DELETE CASCADE,
  "label" TEXT NOT NULL,
  "x" DOUBLE PRECISION NOT NULL,
  "y" DOUBLE PRECISION NOT NULL,
  "width" DOUBLE PRECISION NOT NULL,
  "height" DOUBLE PRECISION NOT NULL,
  "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "bleed" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Page" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "PageSection" (
  "id" TEXT PRIMARY KEY,
  "pageId" TEXT NOT NULL REFERENCES "Page"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "content" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "NavigationItem" (
  "id" TEXT PRIMARY KEY,
  "label" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "location" "NavigationLocation" NOT NULL,
  "group" TEXT NOT NULL DEFAULT '',
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "ThemeSetting" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE DEFAULT 'default',
  "brandName" TEXT NOT NULL,
  "logoUrl" TEXT,
  "primaryColor" TEXT NOT NULL,
  "accentColor" TEXT NOT NULL,
  "backgroundColor" TEXT NOT NULL,
  "footerText" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
