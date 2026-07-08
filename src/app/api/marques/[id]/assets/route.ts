import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, brandAssets } from "@/db";
import { isBlobConfigured } from "@/lib/blob";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const accountId = Number(id);
  const back = (query: string) =>
    NextResponse.redirect(new URL(`/marques/${accountId}?onglet=identite${query}`, request.url), 303);

  if (!isBlobConfigured()) {
    return back("&assetError=Vercel+Blob+n%27est+pas+configuré+pour+activer+l%27upload.");
  }

  try {
    const { put } = await import("@vercel/blob");
    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type")?.toString() || "logo";
    const name = formData.get("name")?.toString() || (file instanceof File ? file.name : "asset");

    if (!(file instanceof File) || file.size === 0) {
      return back("&assetError=Aucun+fichier+reçu.");
    }

    const blob = await put(`marques/${accountId}/${Date.now()}-${file.name}`, file, {
      access: "private",
    });

    await db.insert(brandAssets).values({
      accountId,
      type,
      blobUrl: blob.url,
      name,
      tags: "[]",
    });

    revalidatePath(`/marques/${accountId}`);
    return back("");
  } catch (e) {
    console.error("[blob] upload d'asset échoué", e);
    return back("&assetError=L%27upload+a+échoué.+Réessaie+dans+quelques+minutes.");
  }
}
