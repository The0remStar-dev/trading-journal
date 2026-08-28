// filepath: src/lib/import/brokerProfiles.ts

/**
 * Registre des profils de courtiers connus, utilisé UNIQUEMENT en secours
 * quand aucun PnL n'est fourni par le fichier (trades encore ouverts) et
 * qu'on ne peut donc pas dériver la taille de position depuis le PnL.
 *
 * Chaque profil est détecté par la signature de ses colonnes d'en-tête
 * (jamais par un seuil de valeur arbitraire), ce qui évite les faux positifs
 * sur des brokers dont le volume est légitimement petit (ex: crypto en BTC).
 */
export interface BrokerProfile {
  id: string;
  /** Mots-clés d'en-tête devant être présents ensemble pour identifier ce broker. */
  headerSignature: string[];
  /** Nombre minimum de mots-clés de la signature devant matcher. */
  minMatches: number;
  /** Facteur appliqué au volume brut UNIQUEMENT en fallback (pas de PnL disponible). */
  lotSizeMultiplier: number;
  label: string;
}

export const BROKER_PROFILES: BrokerProfile[] = [
  {
    id: "XTB",
    headerSignature: ["s/l", "t/p", "taxes", "open time", "close time"],
    minMatches: 3,
    lotSizeMultiplier: 100,
    label: "XTB (xStation5)",
  },
  {
    id: "MT4_MT5",
    headerSignature: ["ticket", "swap", "commission", "open price", "close price"],
    minMatches: 3,
    lotSizeMultiplier: 1, // MT4/MT5 exporte déjà le volume en lots réels
    label: "MetaTrader 4/5",
  },
  // ➕ Ajoutez ici un nouveau profil à chaque broker rencontré avec un volume
  // mal calibré ET sans colonne PnL (cas rare — voir la dérivation par PnL
  // dans route.ts, qui couvre l'immense majorité des cas sans configuration).
];

export function detectBrokerProfile(headerCells: string[]): BrokerProfile | null {
  const normalized = headerCells.map((c) => c.toLowerCase().trim());

  for (const profile of BROKER_PROFILES) {
    const matchCount = profile.headerSignature.filter((kw) =>
      normalized.some((c) => c === kw || c.includes(kw))
    ).length;
    if (matchCount >= profile.minMatches) return profile;
  }
  return null;
}