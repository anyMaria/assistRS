import Link from "next/link";
import { Plus } from "lucide-react";
import { db, accounts } from "@/db";
import { createAccount } from "@/app/actions/accounts";
import { AccountForm } from "@/components/AccountForm";
import { FormDialog } from "@/components/FormDialog";
import { SectionHeader } from "@/components/SectionHeader";
import { platformLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MarquesPage() {
  const list = await db.select().from(accounts);

  return (
    <div>
      <SectionHeader
        title="Marques"
        subtitle="Les espaces que tu gères — la tienne, tes clients, les collectivités."
        action={
          <FormDialog trigger={<><Plus size={16} aria-hidden /> Nouvelle marque</>} title="Nouvelle marque">
            <AccountForm action={createAccount} submitLabel="Créer la marque" />
          </FormDialog>
        }
      />

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
              className="card block p-4 card-hover"
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
