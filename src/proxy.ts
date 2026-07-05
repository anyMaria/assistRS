import { NextRequest, NextResponse } from "next/server";
import { verifySessionValue, sessionCookie } from "@/lib/session";

// Protège toute l'application derrière le mot de passe unique.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/connexion")) {
    return NextResponse.next();
  }

  const ok = await verifySessionValue(request.cookies.get(sessionCookie.name)?.value);
  if (!ok) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Tout sauf les assets statiques
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)).*)"],
};
