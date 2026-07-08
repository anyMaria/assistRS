import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { db, reports } from "@/db";
import { buildMonthlyReportData } from "@/lib/report-data";
import { RapportPDF } from "@/components/reports/RapportPDF";
import { isBlobConfigured } from "@/lib/blob";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ accountId: string; mois: string }> },
) {
  const { accountId, mois } = await params;
  const id = Number(accountId);
  if (!id || !/^\d{4}-\d{2}$/.test(mois)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  try {
    const data = await buildMonthlyReportData(id, mois);
    if (!data) return NextResponse.json({ error: "Marque introuvable" }, { status: 404 });

    const buffer = await renderToBuffer(<RapportPDF data={data} />);

    let blobUrl: string | null = null;
    if (isBlobConfigured()) {
      try {
        const { put } = await import("@vercel/blob");
        const blob = await put(`rapports/${id}/${mois}.pdf`, buffer, {
          access: "private",
          addRandomSuffix: true,
        });
        blobUrl = blob.pathname;
      } catch (e) {
        console.error("[blob] enregistrement du rapport échoué", e);
      }
    }
    await db.insert(reports).values({ accountId: id, month: mois, blobUrl });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="rapport-${mois}.pdf"`,
      },
    });
  } catch (e) {
    console.error("[rapport] génération échouée", e);
    return NextResponse.json(
      { error: "La génération du rapport est indisponible. Réessaie dans quelques minutes." },
      { status: 500 },
    );
  }
}
