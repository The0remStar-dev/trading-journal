import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Suppression sécurisée uniquement des trades de l'utilisateur actif
    const deleteResult = await prisma.trade.deleteMany({
      where: { userId: user.id },
    });

    console.log(`Suppression de masse : ${deleteResult.count} trades supprimés pour l'utilisateur ${user.id}`);

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
    });
  } catch (err: any) {
    console.error("ERREUR CRITIQUE DELETE ALL :", err);
    return NextResponse.json(
      { error: "Erreur serveur : " + (err.message || "Erreur inconnue") },
      { status: 500 }
    );
  }
}