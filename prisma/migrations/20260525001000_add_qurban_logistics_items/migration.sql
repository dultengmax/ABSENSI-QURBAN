CREATE TYPE "QurbanLogisticsStatus" AS ENUM ('AVAILABLE', 'LIMITED', 'UNAVAILABLE', 'MAINTENANCE');

CREATE TABLE "qurban_logistics_items" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerContact" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "available" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "status" "QurbanLogisticsStatus" NOT NULL DEFAULT 'AVAILABLE',
    "storageLocation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qurban_logistics_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "qurban_logistics_items_status_idx" ON "qurban_logistics_items"("status");
CREATE INDEX "qurban_logistics_items_ownerName_idx" ON "qurban_logistics_items"("ownerName");
