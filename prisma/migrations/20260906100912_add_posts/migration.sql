-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "emotion" "TradeEmotion" NOT NULL DEFAULT 'NEUTRAL',
    "mistakeSummary" TEXT NOT NULL,
    "lessonLearned" TEXT NOT NULL,
    "beforeImageUrl" TEXT,
    "afterImageUrl" TEXT,
    "linkedTradeId" TEXT,
    "symbol" TEXT,
    "direction" "Direction",
    "entryPrice" DOUBLE PRECISION,
    "exitPrice" DOUBLE PRECISION,
    "rMultiple" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Post_userId_idx" ON "Post"("userId");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
