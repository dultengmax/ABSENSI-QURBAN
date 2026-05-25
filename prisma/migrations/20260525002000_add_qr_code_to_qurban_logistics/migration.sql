ALTER TABLE "qurban_logistics_items"
ADD COLUMN IF NOT EXISTS "qrCode" TEXT;

UPDATE "qurban_logistics_items"
SET "qrCode" = CONCAT('QLOG-', "id")
WHERE "qrCode" IS NULL;

ALTER TABLE "qurban_logistics_items"
ALTER COLUMN "qrCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "qurban_logistics_items_qrCode_key" ON "qurban_logistics_items"("qrCode");
CREATE INDEX IF NOT EXISTS "qurban_logistics_items_qrCode_idx" ON "qurban_logistics_items"("qrCode");
