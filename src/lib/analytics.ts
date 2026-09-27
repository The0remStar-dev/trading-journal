import type { Trade } from "@/types/trade";
import type {
  GlobalPerformance,
  BreakdownEntry,
  EquityPointR,
  SessionName,
  RiskAnalysis,
  BehavioralPattern,
  TradeExtreme,
  HeatmapCell,
  RDistributionBucket,
  StreakDistribution,
  InsightSummary,
  InsightCategory,
} from "@/types/analytics";
import { computeRiskAmount, tradeToR } from "@/lib/rMultiple";

export const MIN_SAMPLE_SIZE = 5; // en dessous, on ne tire aucune conclusion statistique

function effectiveR(trade: Trade, fallbackRiskAmount: number | null): number | null {
  if (trade.rMultiple !== null) return trade.rMultiple;
  if (trade.status === "OPEN") return null;
  return tradeToR(trade.pnl, false, fallbackRiskAmount);
}

function isClosed(trade: Trade): boolean {
  return trade.status !== "OPEN";
}

// --- Performance globale ----------------------------------------------------

export function computeGlobalPerformance(trades: Trade[], fallbackRiskAmount: number | null): GlobalPerformance {
  const closed = trades.filter(isClosed);
  const rValues = closed
    .map((t) => ({ trade: t, r: effectiveR(t, fallbackRiskAmount) }))
    .filter((x): x is { trade: Trade; r: number } => x.r !== null);

  const tradesMissingRiskData = closed.length - rValues.length;

  const wins = rValues.filter((x) => x.r > 0);
  const losses = rValues.filter((x) => x.r < 0);

  // Comptages basés sur le statut (source de vérité déjà figée à l'enregistrement
  // du trade), plutôt que sur le signe du R, pour rester cohérent avec les
  // badges affichés ailleurs (StatusBadge) — un WIN à R≈0 reste un WIN, pas un
  // breakeven, si c'est ce que deriveStatus() a tranché au moment du save.
  const winningTrades = closed.filter((t) => t.status === "WIN").length;
  const losingTrades = closed.filter((t) => t.status === "LOSS").length;
  const breakevenTrades = closed.filter((t) => t.status === "BREAKEVEN").length;

  const totalR = Number(rValues.reduce((sum, x) => sum + x.r, 0).toFixed(2));
  const avgR = rValues.length ? Number((totalR / rValues.length).toFixed(2)) : 0;
  const winRate = rValues.length ? (wins.length / rValues.length) * 100 : 0;
  const lossRate = rValues.length ? (losses.length / rValues.length) * 100 : 0;

  const grossWinR = wins.reduce((sum, x) => sum + x.r, 0);
  const grossLossR = Math.abs(losses.reduce((sum, x) => sum + x.r, 0));

  const avgWinR = wins.length ? Number((grossWinR / wins.length).toFixed(2)) : 0;
  const avgLossR = losses.length ? Number((grossLossR / losses.length).toFixed(2)) : 0;

  const profitFactor = grossLossR > 0 ? Number((grossWinR / grossLossR).toFixed(2)) : grossWinR > 0 ? Infinity : 0;

  const expectancyR = rValues.length
    ? Number(((winRate / 100) * avgWinR - (lossRate / 100) * avgLossR).toFixed(2))
    : 0;

  const sorted = [...rValues].sort(
    (a, b) => new Date(a.trade.entryDate).getTime() - new Date(b.trade.entryDate).getTime()
  );

  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const x of sorted) {
    cumulative += x.r;
    if (cumulative > peak) peak = cumulative;
    const drawdown = peak - cumulative;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  const maxDrawdownR = Number(maxDrawdown.toFixed(2));
  const recoveryFactor = maxDrawdownR > 0 ? Number((totalR / maxDrawdownR).toFixed(2)) : null;

  let currentStreak = 0;
  let currentStreakR = 0;
  let currentStreakIsWin: boolean | null = null;
  let bestWinStreak = { count: 0, totalR: 0 };
  let worstLossStreak = { count: 0, totalR: 0 };

  for (const x of sorted) {
    const isWin = x.r > 0;
    if (currentStreakIsWin === isWin) {
      currentStreak += 1;
      currentStreakR += x.r;
    } else {
      currentStreak = 1;
      currentStreakR = x.r;
      currentStreakIsWin = isWin;
    }
    if (isWin && currentStreak > bestWinStreak.count) {
      bestWinStreak = { count: currentStreak, totalR: Number(currentStreakR.toFixed(2)) };
    }
    if (!isWin && currentStreak > worstLossStreak.count) {
      worstLossStreak = { count: currentStreak, totalR: Number(currentStreakR.toFixed(2)) };
    }
  }

  const dayMap = new Map<string, number>();
  for (const x of sorted) {
    const dayKey = new Date(x.trade.entryDate).toISOString().slice(0, 10);
    dayMap.set(dayKey, (dayMap.get(dayKey) ?? 0) + x.r);
  }
  let bestDay: { date: string; totalR: number } | null = null;
  let worstDay: { date: string; totalR: number } | null = null;
  for (const [date, dayTotalR] of dayMap.entries()) {
    if (!bestDay || dayTotalR > bestDay.totalR) bestDay = { date, totalR: Number(dayTotalR.toFixed(2)) };
    if (!worstDay || dayTotalR < worstDay.totalR) worstDay = { date, totalR: Number(dayTotalR.toFixed(2)) };
  }

  let bestTrade: TradeExtreme | null = null;
  let worstTrade: TradeExtreme | null = null;
  for (const x of rValues) {
    if (!bestTrade || x.r > bestTrade.rMultiple) {
      bestTrade = { id: x.trade.id, symbol: x.trade.symbol, entryDate: x.trade.entryDate, rMultiple: Number(x.r.toFixed(2)) };
    }
    if (!worstTrade || x.r < worstTrade.rMultiple) {
      worstTrade = { id: x.trade.id, symbol: x.trade.symbol, entryDate: x.trade.entryDate, rMultiple: Number(x.r.toFixed(2)) };
    }
  }

  return {
    totalR,
    avgR,
    winRate: Number(winRate.toFixed(1)),
    lossRate: Number(lossRate.toFixed(1)),
    avgWinR,
    avgLossR,
    profitFactor,
    expectancyR,
    maxDrawdownR,
    recoveryFactor,
    totalTrades: trades.length,
    closedTrades: closed.length,
    winningTrades,
    losingTrades,
    breakevenTrades,
    bestWinStreak,
    worstLossStreak,
    bestDay,
    worstDay,
    bestTrade,
    worstTrade,
    tradesMissingRiskData,
  };
}

// --- Répartitions génériques (instrument, tag, session, timeframe, direction) ---

function buildBreakdown(
  trades: Trade[],
  fallbackRiskAmount: number | null,
  getKeys: (trade: Trade) => string[]
): BreakdownEntry[] {
  const map = new Map<string, { totalR: number; wins: number; total: number }>();

  for (const trade of trades) {
    if (!isClosed(trade)) continue;
    const r = effectiveR(trade, fallbackRiskAmount);
    if (r === null) continue;

    for (const key of getKeys(trade)) {
      const entry = map.get(key) ?? { totalR: 0, wins: 0, total: 0 };
      entry.totalR += r;
      entry.total += 1;
      if (r > 0) entry.wins += 1;
      map.set(key, entry);
    }
  }

  return Array.from(map.entries())
    .map(([key, v]) => ({
      key,
      totalR: Number(v.totalR.toFixed(2)),
      avgR: Number((v.totalR / v.total).toFixed(2)),
      winRate: Number(((v.wins / v.total) * 100).toFixed(1)),
      totalTrades: v.total,
    }))
    .sort((a, b) => b.totalR - a.totalR);
}

export function computeByInstrument(trades: Trade[], fallbackRiskAmount: number | null): BreakdownEntry[] {
  return buildBreakdown(trades, fallbackRiskAmount, (t) => [t.symbol]);
}

export function computeByTag(trades: Trade[], fallbackRiskAmount: number | null): BreakdownEntry[] {
  return buildBreakdown(trades, fallbackRiskAmount, (t) => t.tags);
}

export function computeByTimeframe(trades: Trade[], fallbackRiskAmount: number | null): BreakdownEntry[] {
  return buildBreakdown(trades, fallbackRiskAmount, (t) => (t.timeframe ? [t.timeframe] : []));
}

export function computeByDirection(trades: Trade[], fallbackRiskAmount: number | null): BreakdownEntry[] {
  return buildBreakdown(trades, fallbackRiskAmount, (t) => [t.direction]);
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Lundi -> Dimanche pour l'affichage

/**
 * Performance par jour de semaine, dans l'ordre chronologique de la semaine
 * (Lun -> Dim), contrairement aux autres breakdowns triés par performance.
 */
export function computeByDayOfWeek(trades: Trade[], fallbackRiskAmount: number | null): BreakdownEntry[] {
  const buckets = new Map<number, { totalR: number; wins: number; total: number }>();

  for (const trade of trades) {
    if (!isClosed(trade)) continue;
    const r = effectiveR(trade, fallbackRiskAmount);
    if (r === null) continue;

    const day = new Date(trade.entryDate).getUTCDay();
    const entry = buckets.get(day) ?? { totalR: 0, wins: 0, total: 0 };
    entry.totalR += r;
    entry.total += 1;
    if (r > 0) entry.wins += 1;
    buckets.set(day, entry);
  }

  return DAY_ORDER.map((day) => {
    const v = buckets.get(day);
    return {
      key: DAY_LABELS[day],
      totalR: v ? Number(v.totalR.toFixed(2)) : 0,
      avgR: v ? Number((v.totalR / v.total).toFixed(2)) : 0,
      winRate: v ? Number(((v.wins / v.total) * 100).toFixed(1)) : 0,
      totalTrades: v ? v.total : 0,
    };
  });
}

// --- Session (dérivée de l'heure UTC d'entrée) ------------------------------

export function deriveSession(entryDate: string): SessionName {
  const hour = new Date(entryDate).getUTCHours();
  if (hour >= 0 && hour < 7) return "Asie";
  if (hour >= 7 && hour < 13) return "Londres";
  if (hour >= 13 && hour < 21) return "New York";
  return "Autres";
}

export function computeBySession(trades: Trade[], fallbackRiskAmount: number | null): BreakdownEntry[] {
  return buildBreakdown(trades, fallbackRiskAmount, (t) => [deriveSession(t.entryDate)]);
}

// --- Equity curve en R -------------------------------------------------------

export function computeEquityCurveR(trades: Trade[], fallbackRiskAmount: number | null): EquityPointR[] {
  const closed = trades
    .filter(isClosed)
    .map((t) => ({ trade: t, r: effectiveR(t, fallbackRiskAmount) }))
    .filter((x): x is { trade: Trade; r: number } => x.r !== null)
    .sort((a, b) => new Date(a.trade.entryDate).getTime() - new Date(b.trade.entryDate).getTime());

  let cumulative = 0;
  return closed.map((x) => {
    cumulative += x.r;
    return {
      date: x.trade.entryDate,
      cumulativeR: Number(cumulative.toFixed(2)),
      tradeR: Number(x.r.toFixed(2)),
    };
  });
}

// --- Heatmap heure x jour de semaine (avec winRate par cellule) -------------

export function computeHourlyHeatmap(trades: Trade[], fallbackRiskAmount: number | null): HeatmapCell[] {
  const buckets = new Map<string, { totalR: number; wins: number; total: number }>();

  for (const trade of trades) {
    if (!isClosed(trade)) continue;
    const r = effectiveR(trade, fallbackRiskAmount);
    if (r === null) continue;

    const date = new Date(trade.entryDate);
    const key = `${date.getUTCDay()}-${date.getUTCHours()}`;
    const entry = buckets.get(key) ?? { totalR: 0, wins: 0, total: 0 };
    entry.totalR += r;
    entry.total += 1;
    if (r > 0) entry.wins += 1;
    buckets.set(key, entry);
  }

  return Array.from(buckets.entries()).map(([key, v]) => {
    const [dayOfWeek, hour] = key.split("-").map(Number);
    return {
      dayOfWeek,
      hour,
      avgR: Number((v.totalR / v.total).toFixed(2)),
      totalTrades: v.total,
      winRate: Number(((v.wins / v.total) * 100).toFixed(1)),
    };
  });
}

// --- Distribution des R -------------------------------------------------------

const R_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "< -3R", min: -Infinity, max: -3 },
  { label: "-3R à -2R", min: -3, max: -2 },
  { label: "-2R à -1R", min: -2, max: -1 },
  { label: "-1R à 0R", min: -1, max: 0 },
  { label: "0R à 1R", min: 0, max: 1 },
  { label: "1R à 2R", min: 1, max: 2 },
  { label: "2R à 3R", min: 2, max: 3 },
  { label: "> 3R", min: 3, max: Infinity },
];

export function computeRDistribution(trades: Trade[], fallbackRiskAmount: number | null): RDistributionBucket[] {
  const counts = R_BUCKETS.map(() => 0);

  for (const trade of trades) {
    if (!isClosed(trade)) continue;
    const r = effectiveR(trade, fallbackRiskAmount);
    if (r === null) continue;

    const idx = R_BUCKETS.findIndex((b) => r >= b.min && r < b.max) ;
    const finalIdx = idx === -1 ? R_BUCKETS.length - 1 : idx;
    counts[finalIdx] += 1;
  }

  return R_BUCKETS.map((b, i) => ({
    bucket: b.label,
    count: counts[i],
    isPositive: b.min >= 0,
  }));
}

// --- Distribution des séries de gains / pertes -------------------------------

export function computeStreakDistribution(trades: Trade[], fallbackRiskAmount: number | null): StreakDistribution {
  const closed = trades.filter(isClosed);
  const rValues = closed
    .map((t) => ({ trade: t, r: effectiveR(t, fallbackRiskAmount) }))
    .filter((x): x is { trade: Trade; r: number } => x.r !== null)
    .sort((a, b) => new Date(a.trade.entryDate).getTime() - new Date(b.trade.entryDate).getTime());

  const winLengths = new Map<number, number>();
  const lossLengths = new Map<number, number>();

  let currentStreak = 0;
  let currentIsWin: boolean | null = null;

  function flush() {
    if (currentStreak === 0 || currentIsWin === null) return;
    const map = currentIsWin ? winLengths : lossLengths;
    map.set(currentStreak, (map.get(currentStreak) ?? 0) + 1);
  }

  for (const x of rValues) {
    const isWin = x.r > 0;
    if (currentIsWin === isWin) {
      currentStreak += 1;
    } else {
      flush();
      currentStreak = 1;
      currentIsWin = isWin;
    }
  }
  flush();

  const toSortedArray = (map: Map<number, number>) =>
    Array.from(map.entries())
      .map(([length, count]) => ({ length, count }))
      .sort((a, b) => a.length - b.length);

  return {
    winStreaks: toSortedArray(winLengths),
    lossStreaks: toSortedArray(lossLengths),
  };
}

// --- Résumés statistiques neutres (distincts des alertes comportementales) --

/**
 * Génère des constats statistiques neutres pour les catégories les plus
 * représentées (setup, instrument, session), avec formulation prudente.
 * Se distingue de detectBehavioralPatterns() qui, lui, signale des
 * comportements à risque — ici on décrit factuellement la répartition.
 */
export function computeInsightSummaries(trades: Trade[], fallbackRiskAmount: number | null): InsightSummary[] {
  const categories: { category: InsightCategory; entries: BreakdownEntry[] }[] = [
    { category: "setup", entries: computeByTag(trades, fallbackRiskAmount) },
    { category: "instrument", entries: computeByInstrument(trades, fallbackRiskAmount) },
    { category: "session", entries: computeBySession(trades, fallbackRiskAmount) },
  ];

  return categories.map(({ category, entries }) => {
    const eligible = entries.filter((e) => e.totalTrades >= MIN_SAMPLE_SIZE);
    const top = eligible.sort((a, b) => b.totalTrades - a.totalTrades)[0];

    if (!top) {
      return {
        category,
        label: null,
        totalTrades: 0,
        totalR: 0,
        winRate: 0,
        insufficientData: true,
      };
    }

    return {
      category,
      label: top.key,
      totalTrades: top.totalTrades,
      totalR: top.totalR,
      winRate: top.winRate,
      insufficientData: false,
    };
  });
}

// --- Analyse du risque --------------------------------------------------------

function plannedRiskUnits(trade: Trade): number | null {
  if (trade.stopLoss === null) return null;
  const diff = Math.abs(trade.entryPrice - trade.stopLoss);
  if (diff === 0) return null;
  return diff * trade.positionSize;
}

export function computeRiskAnalysis(trades: Trade[], fallbackRiskAmount: number | null): RiskAnalysis {
  const closed = trades.filter(isClosed);
  const withStop = closed
    .map((t) => ({ trade: t, risk: plannedRiskUnits(t) }))
    .filter((x): x is { trade: Trade; risk: number } => x.risk !== null);

  const tradesWithStopData = withStop.length;
  const tradesWithoutStopData = closed.length - withStop.length;

  if (withStop.length < MIN_SAMPLE_SIZE) {
    return {
      avgRiskRatio: null,
      riskStdDev: null,
      outlierTrades: [],
      tradesWithStopData,
      tradesWithoutStopData,
      behaviorAfterLoss: null,
    };
  }

  const avgRisk = withStop.reduce((sum, x) => sum + x.risk, 0) / withStop.length;
  const variance = withStop.reduce((sum, x) => sum + Math.pow(x.risk - avgRisk, 2), 0) / withStop.length;
  const riskStdDev = Math.sqrt(variance);

  const outlierTrades = withStop
    .filter((x) => x.risk > avgRisk * 1.5)
    .map((x) => ({
      id: x.trade.id,
      symbol: x.trade.symbol,
      entryDate: x.trade.entryDate,
      riskRatio: Number((x.risk / avgRisk).toFixed(2)),
      rMultiple: effectiveR(x.trade, fallbackRiskAmount),
    }))
    .sort((a, b) => b.riskRatio - a.riskRatio)
    .slice(0, 10);

  const sorted = [...closed].sort(
    (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );
  const afterLossR: number[] = [];
  const afterWinR: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevR = effectiveR(sorted[i - 1], fallbackRiskAmount);
    const currR = effectiveR(sorted[i], fallbackRiskAmount);
    if (prevR === null || currR === null) continue;
    if (prevR < 0) afterLossR.push(currR);
    if (prevR > 0) afterWinR.push(currR);
  }

  const behaviorAfterLoss =
    afterLossR.length >= MIN_SAMPLE_SIZE || afterWinR.length >= MIN_SAMPLE_SIZE
      ? {
          avgRAfterLoss: afterLossR.length
            ? Number((afterLossR.reduce((s, r) => s + r, 0) / afterLossR.length).toFixed(2))
            : null,
          avgRAfterWin: afterWinR.length
            ? Number((afterWinR.reduce((s, r) => s + r, 0) / afterWinR.length).toFixed(2))
            : null,
        }
      : null;

  return {
    avgRiskRatio: 1,
    riskStdDev: Number((riskStdDev / avgRisk).toFixed(2)),
    outlierTrades,
    tradesWithStopData,
    tradesWithoutStopData,
    behaviorAfterLoss,
  };
}

// --- Détection comportementale (règles, formulations prudentes) -------------

export function detectBehavioralPatterns(
  trades: Trade[],
  fallbackRiskAmount: number | null
): BehavioralPattern[] {
  const patterns: BehavioralPattern[] = [];
  const closed = trades.filter(isClosed);

  if (closed.length < MIN_SAMPLE_SIZE) {
    return [
      {
        id: "insufficient-data",
        severity: "info",
        title: "Données insuffisantes",
        description: `Il faut au moins ${MIN_SAMPLE_SIZE} trades clôturés pour détecter des patterns fiables. Continuez à logger vos trades.`,
      },
    ];
  }

  const risk = computeRiskAnalysis(trades, fallbackRiskAmount);
  if (risk.outlierTrades.length > 0) {
    patterns.push({
      id: "risk-outliers",
      severity: "warning",
      title: "Prises de risque inhabituelles détectées",
      description: `Tes données suggèrent que ${risk.outlierTrades.length} trade(s) ont été pris avec un risque supérieur de 50%+ à ta moyenne habituelle. Vérifie si ces écarts étaient intentionnels.`,
      occurrences: risk.outlierTrades.length,
    });
  }

  if (
    risk.behaviorAfterLoss !== null &&
    risk.behaviorAfterLoss.avgRAfterLoss !== null &&
    risk.behaviorAfterLoss.avgRAfterWin !== null
  ) {
    const afterLoss = risk.behaviorAfterLoss.avgRAfterLoss;
    const afterWin = risk.behaviorAfterLoss.avgRAfterWin;
    if (afterLoss < afterWin - 0.3) {
      const sortedByDate = [...closed].sort(
        (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
      );
      let occurrences = 0;
      for (let i = 1; i < sortedByDate.length; i++) {
        const prevR = effectiveR(sortedByDate[i - 1], fallbackRiskAmount);
        if (prevR !== null && prevR < 0) occurrences++;
      }
      patterns.push({
        id: "revenge-trading",
        severity: "warning",
        title: "Pattern potentiel de revenge trading",
        description: `Tu sembles avoir de moins bons résultats juste après une perte (${afterLoss.toFixed(2)}R en moyenne) que juste après un gain (${afterWin.toFixed(2)}R). Ce n'est pas une certitude, mais surveille ton état émotionnel après une perte.`,
        occurrences,
      });
    }
  }

  const dayCount = new Map<string, number>();
  for (const t of closed) {
    const key = new Date(t.entryDate).toISOString().slice(0, 10);
    dayCount.set(key, (dayCount.get(key) ?? 0) + 1);
  }
  const counts = Array.from(dayCount.values());
  const avgPerDay = counts.reduce((s, c) => s + c, 0) / counts.length;
  const overtradingDays = counts.filter((c) => c > avgPerDay * 2 && c >= 5).length;
  if (overtradingDays > 0 && avgPerDay > 0) {
    patterns.push({
      id: "overtrading",
      severity: "warning",
      title: "Journées à volume de trades élevé",
      description: `Pattern potentiel détecté : ${overtradingDays} journée(s) où tu as pris plus du double de ton nombre de trades habituel (moyenne : ${avgPerDay.toFixed(1)}/jour). Le surtrading est souvent corrélé à une baisse de discipline.`,
      occurrences: overtradingDays,
    });
  }

  const sortedAll = [...closed].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
  let rapidEntries = 0;
  for (let i = 1; i < sortedAll.length; i++) {
    if (sortedAll[i].symbol !== sortedAll[i - 1].symbol) continue;
    const diffMinutes = (new Date(sortedAll[i].entryDate).getTime() - new Date(sortedAll[i - 1].entryDate).getTime()) / 60000;
    if (diffMinutes < 15) rapidEntries++;
  }
  if (rapidEntries >= 3) {
    patterns.push({
      id: "rapid-entries",
      severity: "warning",
      title: "Entrées rapprochées détectées",
      description: `Tes données suggèrent ${rapidEntries} cas où tu es entré sur le même instrument à moins de 15 minutes d'intervalle. Cela peut indiquer une entrée impulsive plutôt que planifiée.`,
      occurrences: rapidEntries,
    });
  }

  const heatmap = computeHourlyHeatmap(trades, fallbackRiskAmount);
  const significantHours = heatmap.filter((h) => h.totalTrades >= MIN_SAMPLE_SIZE);
  const worstHour = significantHours.sort((a, b) => a.avgR - b.avgR)[0];
  if (worstHour && worstHour.avgR < -0.3) {
    patterns.push({
      id: "underperforming-hour",
      severity: "warning",
      title: "Créneau horaire sous-performant",
      description: `Tu sembles avoir de moins bons résultats autour de ${worstHour.hour}h UTC (${worstHour.avgR.toFixed(2)}R en moyenne sur ${worstHour.totalTrades} trades). Pattern potentiel à surveiller, pas une certitude statistique définitive.`,
      occurrences: worstHour.totalTrades,
    });
  }

  const byTag = computeByTag(trades, fallbackRiskAmount).filter((t) => t.totalTrades >= MIN_SAMPLE_SIZE);
  const worstTag = byTag[byTag.length - 1];
  const bestTag = byTag[0];
  if (worstTag && worstTag.totalR < -1) {
    patterns.push({
      id: "negative-setup",
      severity: "warning",
      title: `Setup "${worstTag.key}" en difficulté`,
      description: `Tes données suggèrent que le setup/tag "${worstTag.key}" est négatif sur ${worstTag.totalTrades} trades (${worstTag.totalR}R). Envisage de le retravailler ou de réduire ton exposition dessus.`,
      occurrences: worstTag.totalTrades,
    });
  }
  if (bestTag && bestTag.totalR > 1 && bestTag.key !== worstTag?.key) {
    patterns.push({
      id: "best-setup",
      severity: "positive",
      title: `Setup "${bestTag.key}" performant`,
      description: `Le setup/tag "${bestTag.key}" ressort comme ton plus performant sur la période (${bestTag.totalR >= 0 ? "+" : ""}${bestTag.totalR}R, winrate ${bestTag.winRate}%). Tes données suggèrent que c'est un edge à cultiver.`,
      occurrences: bestTag.totalTrades,
    });
  }

  const withPlanData = closed.filter((t) => t.planRespected !== null);
  if (withPlanData.length >= MIN_SAMPLE_SIZE) {
    const respected = withPlanData.filter((t) => t.planRespected === true);
    const notRespected = withPlanData.filter((t) => t.planRespected === false);
    if (respected.length >= 3 && notRespected.length >= 3) {
      const avgRespected =
        respected.reduce((s, t) => s + (effectiveR(t, fallbackRiskAmount) ?? 0), 0) / respected.length;
      const avgNotRespected =
        notRespected.reduce((s, t) => s + (effectiveR(t, fallbackRiskAmount) ?? 0), 0) / notRespected.length;
      if (avgRespected > avgNotRespected + 0.2) {
        patterns.push({
          id: "plan-discipline",
          severity: "info",
          title: "Le respect du plan semble payer",
          description: `Tes trades où tu as respecté ton plan affichent en moyenne ${avgRespected.toFixed(2)}R, contre ${avgNotRespected.toFixed(2)}R quand ce n'était pas le cas. Ce n'est pas garanti pour chaque trade, mais la tendance suggère un vrai edge dans la discipline.`,
          occurrences: respected.length + notRespected.length,
        });
      }
    }
  }

  const stopMovedTrades = closed.filter((t) => t.stopMoved);
  if (stopMovedTrades.length >= 3) {
    const avgR =
      stopMovedTrades.reduce((s, t) => s + (effectiveR(t, fallbackRiskAmount) ?? 0), 0) / stopMovedTrades.length;
    const others = closed.filter((t) => !t.stopMoved);
    const avgOthersR = others.length
      ? others.reduce((s, t) => s + (effectiveR(t, fallbackRiskAmount) ?? 0), 0) / others.length
      : 0;
    if (avgR < avgOthersR - 0.2) {
      patterns.push({
        id: "stop-moved-impact",
        severity: "warning",
        title: "Déplacer ton stop semble te coûter cher",
        description: `Tes trades où tu as déplacé ton stop en cours de route affichent ${avgR.toFixed(2)}R en moyenne, contre ${avgOthersR.toFixed(2)}R sinon. Pattern potentiel à surveiller.`,
        occurrences: stopMovedTrades.length,
      });
    }
  }

  if (patterns.length === 0) {
    patterns.push({
      id: "no-clear-pattern",
      severity: "info",
      title: "Aucun pattern marquant détecté",
      description: "Sur cette période, tes données ne font ressortir aucun biais comportemental évident. Continue à logger tes trades pour affiner l'analyse dans le temps.",
    });
  }

  return patterns;
}