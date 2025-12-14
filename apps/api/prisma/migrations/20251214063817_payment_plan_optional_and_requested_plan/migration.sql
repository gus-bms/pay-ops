/*
  Warnings:

  - Added the required column `requestedPlanId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_planId_fkey`;

-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `requestedPlanId` VARCHAR(191) NOT NULL,
    MODIFY `planId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Payment_requestedPlanId_createdAt_idx` ON `Payment`(`requestedPlanId`, `createdAt`);

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
