import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/trades/facets — valeurs distinctes de symbol/tags de l'utilisateur,
// pour peupler dynamiquement les filtres Analytics (jamais de liste hardcodée).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const trades = await prisma.trade.findMany({
    where: { userId: user.id },
    select: { symbol: true, tags: true },
  });

  const symbols = new Set<string>();
  const tags = new Set<string>();

  for (const t of trades) {
    symbols.add(t.symbol);
    try {
      const parsed: string[] = JSON.parse(t.tags);
      parsed.forEach((tag) => tags.add(tag));
    } catch {
      // tags mal formés ignorés silencieusement
    }
  }

  return NextResponse.json({
    symbols: Array.from(symbols).sort(),
    tags: Array.from(tags).sort(),
  });
}