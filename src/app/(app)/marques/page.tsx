import Link from "next/link";
import { db, accounts } from "@/db";
import { createAccount } from "@/app/actions/accounts";
import { AccountForm } from "@/components/AccountForm";
import { platformLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MarquesPage() {
  const list = await db.select().from(accounts);

  return (
    <div>
      <h1 className="font-display text-4xl italic">Marques</h1>
      <p className="mt-1 text-ink/60">
        Les espaces que tu gères — la tienne, tes clients, les collectivités.
      </p>

      <details className="card mt-6">
        <summary className="cursor-pointer p-4 font-display text-2xl">+ Nouvelle marque</summary>
        <div className="border-t-2 border-ink p-5">
          <AccountForm action={createAccount} submitLabel="Créer la marque" />
        </div>
      </details>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.length === 0 && (
          <p className="text-ink/50 italic">Aucune marque pour l&apos;instant — crée la première ci-dessus.</p>
        )}
        {list.map((account) => {
          const platforms: string[] = JSON.parse(account.platforms);
          return (
            <Link
              key={account.id}
              href={`/marques/${account.id}`}
              className="card block p-4 transition hover:shadow-[3px_3px_0_#1C1917]"
              style={{ borderTopWidth: 6, borderTopColor: account.color }}
            >
              <p className="font-display text-xl">{account.name}</p>
              <p className="text-sm text-ink/50">{account.sector || "—"}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {platforms.map((p) => (
                  <span key={p} className="tag">{platformLabel(p)}</span>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink/40">
                Validation client : {account.validationDelayDays} j
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
