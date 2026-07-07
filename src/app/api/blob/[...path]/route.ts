import { NextResponse } from "next/server";

// Proxifie les blobs privés (logos, moodboards) — le SDK Blob exige l'accès serveur
// même en "private", cette route relit le fichier et le ressert au navigateur.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathname = decodeURIComponent(path.join("/"));
  try {
    const { get } = await import("@vercel/blob");
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
    }
    return new NextResponse(result.stream, {
      headers: { "Content-Type": result.blob.contentType, "Cache-Control": "private, max-age=3600" },
    });
  } catch (e) {
    console.error("[blob] lecture échouée", e);
    return NextResponse.json({ error: "Image indisponible" }, { status: 500 });
  }
}
