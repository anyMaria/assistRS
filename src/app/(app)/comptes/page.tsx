import { db, accounts } from "@/db";
import { createAccount, updateAccount, deleteAccount } from "@/app/actions/accounts";
import { AccountForm } from "@/components/AccountForm";
import { platformLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ComptesPage() {
  const list = await db.select().from(accounts);

  return (
    <div>
      <h1 className="font-display text-4xl italic">Comptes</h1>
      <p className="mt-1 text-ink/60">
        Les profils que tu gères — leur ton, leur cible et leur délai de validation.
      </p>

      <section className="card mt-6 p-5">
        <h2 className="font-display text-2xl">Nouveau compte</h2>
        <div className="mt-4">
          <AccountForm action={createAccount} submitLabel="Créer le compte" />
        </div>
      </section>

      <section className="mt-8 space-y-4">
        {list.length === 0 && (
          <p className="text-ink/50 italic">Aucun compte pour l&apos;instant — crée le premier ci-dessus.</p>
        )}
        {list.map((account) => {
          const platforms: string[] = JSON.parse(account.platforms);
          const update = updateAccount.bind(null, account.id);
          const remove = deleteAccount.bind(null, account.id);
          return (
            <details key={account.id} className="card">
              <summary className="flex cursor-pointer items-center gap-3 p-4">
                <span
                  className="h-4 w-4 shrink-0 border border-ink"
                  style={{ backgroundColor: account.color }}
                />
                <span className="font-semibold text-lg">{account.name}</span>
                <span className="text-sm text-ink/50">{account.sector}</span>
                <span className="ml-auto flex gap-1">
                  {platforms.map((p) => (
                    <span key={p} className="tag">{platformLabel(p)}</span>
                  ))}
                </span>
                <span className="tag border-ink/20 text-ink/50">
                  validation {account.validationDelayDays} j
                </span>
              </summary>
              <div className="border-t-2 border-ink p-5">
                <AccountForm account={account} action={update} submitLabel="Enregistrer" />
                <form action={remove} className="mt-4 border-t border-ink/10 pt-4">
                  <button
                    type="submit"
                    className="text-sm font-semibold text-danger underline underline-offset-2"
                  >
                    Supprimer ce compte (et ses publications)
                  </button>
                </form>
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
