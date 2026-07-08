import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

// Route temporaire : ajoute la colonne buffer_post_id manquante en prod (voir erreur
// Vercel digest 3625114486). À supprimer après exécution une fois.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    await db.run(sql`ALTER TABLE publications ADD COLUMN buffer_post_id TEXT`);
    return NextResponse.json({ ok: true, message: "Colonne buffer_post_id ajoutée" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("duplicate column name")) {
      return NextResponse.json({ ok: true, message: "Colonne déjà présente" });
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
