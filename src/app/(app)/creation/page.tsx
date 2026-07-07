import Link from "next/link";
import { db, accounts } from "@/db";
import { IdeaGeneratorForm } from "@/components/IdeaGeneratorForm";

export const dynamic = "force-dynamic";

export default async function CreationPage() {
  const allAccounts = await db.select().from(accounts);

  return (
    <div>
      <h1 className="font-display text-4xl italic">Créer</h1>
      <p className="mt-1 text-ink/60">
        Génère 3 à 5 idées de publication avec l&apos;IA, nourries par le profil de la marque.
      </p>

      {allAccounts.length === 0 ? (
        <p className="card mt-6 p-5">
          Commence par <Link href="/marques" className="font-semibold text-accent underline">créer une marque</Link>.
        </p>
      ) : (
        <div className="mt-6">
          <IdeaGeneratorForm accounts={allAccounts} />
        </div>
      )}

      <p className="mt-8 text-sm text-ink/50">
        Les idées retenues rejoignent la <Link href="/idees" className="text-accent underline">bibliothèque d&apos;idées</Link>.
        La rédaction de légende, la mémoire de corrections et la déclinaison multi-plateformes se font depuis le détail
        d&apos;une idée ou d&apos;une publication (clique sur son titre dans /idees ou /planning).
      </p>
    </div>
  );
}
