import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionValue, sessionCookie } from "@/lib/session";

async function login(formData: FormData) {
  "use server";
  const password = formData.get("password");
  if (!password || password !== process.env.APP_PASSWORD) {
    redirect("/connexion?erreur=1");
  }
  const value = await createSessionValue();
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionCookie.maxAge,
    path: "/",
  });
  redirect("/");
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="border-2 border-ink bg-white p-8">
          <p className="font-display text-3xl italic text-ink">Trinkets Design</p>
          <h1 className="mt-1 text-sm uppercase tracking-[0.2em] text-ink/60">
            Assistant réseaux sociaux
          </h1>
          <form action={login} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink">Mot de passe</span>
              <input
                type="password"
                name="password"
                autoFocus
                required
                className="mt-1 w-full border-2 border-ink bg-paper px-3 py-3 text-lg outline-none focus:bg-white"
              />
            </label>
            {erreur && (
              <p className="text-sm font-medium text-danger">Mot de passe incorrect.</p>
            )}
            <button
              type="submit"
              className="w-full border-2 border-ink bg-accent px-4 py-3 font-semibold text-white transition hover:bg-ink"
            >
              Entrer
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
