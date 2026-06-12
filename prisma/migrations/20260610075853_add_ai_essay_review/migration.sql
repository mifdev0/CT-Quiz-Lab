-- AlterTable
ALTER TABLE "StudentChallengeAnswer" ADD COLUMN     "aiFeedback" TEXT,
ADD COLUMN     "aiScore" INTEGER,
ADD COLUMN     "needsReview" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "StudentTestAnswer" ADD COLUMN     "aiFeedback" TEXT,
ADD COLUMN     "aiScore" INTEGER,
ADD COLUMN     "needsReview" BOOLEAN NOT NULL DEFAULT false;
