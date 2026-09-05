import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { AvailableMonth } from "@/types/monthlyStats";

const MONTH_LABELS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Non autorisé." },
      { status: 401 }
    );
  }

  const trades = await prisma.trade.findMany({
    where: { userId: user.id },
    select: { entryDate: true },
    orderBy: { entryDate: "desc" },
  });

  const seen = new Set<string>();
  const months: AvailableMonth[] = [];

  for (const trade of trades) {
    const year = trade.entryDate.getFullYear();
    const monthIndex = trade.entryDate.getMonth();
    const value = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    months.push({
      value,
      label: `${MONTH_LABELS_FR[monthIndex]} ${year}`,
    });
  }

  const now = new Date();
  const currentValue = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  if (!seen.has(currentValue)) {
    months.unshift({
      value: currentValue,
      label: `${MONTH_LABELS_FR[now.getMonth()]} ${now.getFullYear()}`,
    });
  }

  return NextResponse.json({ months });
}