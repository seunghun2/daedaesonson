-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "minPrice" BIGINT NOT NULL,
    "maxPrice" BIGINT NOT NULL,
    "description" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "images" TEXT,
    "hasParking" BOOLEAN NOT NULL DEFAULT false,
    "hasRestaurant" BOOLEAN NOT NULL DEFAULT false,
    "hasStore" BOOLEAN NOT NULL DEFAULT false,
    "hasAccessibility" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceCategory" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "orderNo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceItem" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "normalizedItemType" TEXT,
    "groupType" TEXT,
    "description" TEXT,
    "raw" TEXT,
    "price" BIGINT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '1기',
    "sizeValue" DOUBLE PRECISION,
    "sizeUnit" TEXT,
    "hasInstallation" BOOLEAN NOT NULL DEFAULT false,
    "hasManagementFee" BOOLEAN NOT NULL DEFAULT false,
    "includedYear" INTEGER,
    "discountAvailable" BOOLEAN NOT NULL DEFAULT false,
    "discountTargets" TEXT,
    "refundRule" TEXT,
    "minQty" INTEGER NOT NULL DEFAULT 1,
    "maxQty" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MappingDictionary" (
    "id" TEXT NOT NULL,
    "rawName" TEXT NOT NULL,
    "normalizedType" TEXT NOT NULL,
    "normalizedGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MappingDictionary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceCategory_facilityId_idx" ON "PriceCategory"("facilityId");

-- CreateIndex
CREATE INDEX "PriceItem_facilityId_idx" ON "PriceItem"("facilityId");

-- CreateIndex
CREATE INDEX "PriceItem_categoryId_idx" ON "PriceItem"("categoryId");

-- CreateIndex
CREATE INDEX "PriceItem_normalizedItemType_idx" ON "PriceItem"("normalizedItemType");

-- CreateIndex
CREATE INDEX "PriceItem_groupType_idx" ON "PriceItem"("groupType");

-- CreateIndex
CREATE UNIQUE INDEX "MappingDictionary_rawName_key" ON "MappingDictionary"("rawName");

-- CreateIndex
CREATE INDEX "MappingDictionary_rawName_idx" ON "MappingDictionary"("rawName");

-- AddForeignKey
ALTER TABLE "PriceCategory" ADD CONSTRAINT "PriceCategory_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceItem" ADD CONSTRAINT "PriceItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PriceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceItem" ADD CONSTRAINT "PriceItem_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

