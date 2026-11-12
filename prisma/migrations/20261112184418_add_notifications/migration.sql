-- CreateEnum
CREATE TYPE "ChallengeRuleType" AS ENUM ('DAILY_LOG_STREAK', 'TOTAL_TRADES', 'RISK_RESPECTED_STREAK');

-- CreateEnum
CREATE TYPE "UserChallengeStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleType" "ChallengeRuleType" NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "windowDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "status" "UserChallengeStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeProgress" (
    "id" TEXT NOT NULL,
    "userChallengeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "achieved" BOOLEAN NOT NULL,

    CONSTRAINT "ChallengeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "ruleType" "ChallengeRuleType" NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "windowDays" INTEGER,
    "challengeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Streak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_code_key" ON "Challenge"("code");

-- CreateIndex
CREATE INDEX "UserChallenge_userId_idx" ON "UserChallenge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserChallenge_userId_challengeId_key" ON "UserChallenge"("userId", "challengeId");

-- CreateIndex
CREATE INDEX "ChallengeProgress_userChallengeId_idx" ON "ChallengeProgress"("userChallengeId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeProgress_userChallengeId_date_key" ON "ChallengeProgress"("userChallengeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_challengeId_key" ON "Badge"("challengeId");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "Streak_userId_key" ON "Streak"("userId");

-- AddForeignKey
ALTER TABLE "UserChallenge" ADD CONSTRAINT "UserChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallenge" ADD CONSTRAINT "UserChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeProgress" ADD CONSTRAINT "ChallengeProgress_userChallengeId_fkey" FOREIGN KEY ("userChallengeId") REFERENCES "UserChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;