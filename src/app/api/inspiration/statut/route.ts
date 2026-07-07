import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ingestSearch } from "@/lib/inspiration-ingest";

export async function GET(req: NextRequest) {
  const searchId = Number(req.nextUrl.searchParams.get("searchId"));
  if (!searchId) return NextResponse.json({ error: "searchId manquant" }, { status: 400 });

  const result = await ingestSearch(searchId);
  revalidatePath("/conception");
  return NextResponse.json(result);
}
