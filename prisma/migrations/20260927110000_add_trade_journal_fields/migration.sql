-- Add the trade journal fields already used by the API.
CREATE TYPE "Timeframe" AS ENUM ('M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'OTHER');

ALTER TABLE "Trade"
  ADD COLUMN "stopLoss" DOUBLE PRECISION,
  ADD COLUMN "takeProfit" DOUBLE PRECISION,
  ADD COLUMN "rMultiple" DOUBLE PRECISION,
  ADD COLUMN "timeframe" "Timeframe",
  ADD COLUMN "setupQuality" DOUBLE PRECISION,
  ADD COLUMN "planRespected" BOOLEAN,
  ADD COLUMN "stopMoved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "tpMoved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "errorType" TEXT;