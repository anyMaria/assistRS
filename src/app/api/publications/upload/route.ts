import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { insertAssetIfMissing } from "@/lib/publication-assets";

/**
 * Upload côté client (G14) : les server actions plafonnent le corps de requête à
 * quelques Mo, les photos passent donc en direct navigateur → Blob. Cette route ne fait
 * que délivrer un jeton signé (onBeforeGenerateToken) et enregistrer la ligne en base
 * une fois l'upload terminé (onUploadCompleted) — non rappelée en dev local (URL non
 * joignable), d'où le repli côté client `enregistrerAssetSecours`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: clientPayload,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const payload = tokenPayload ? (JSON.parse(tokenPayload) as { publicationId: number }) : null;
          if (!payload?.publicationId) return;
          await insertAssetIfMissing(payload.publicationId, blob.url, blob.pathname);
        } catch (e) {
          console.error("[blob] enregistrement de l'asset échoué", e);
        }
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (e) {
    console.error("[blob] upload échoué", e);
    return NextResponse.json({ error: "Upload indisponible pour l'instant." }, { status: 400 });
  }
}
