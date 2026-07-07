import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, accounts, monthlyRituals } from "@/db";
import { demarrerRituel } from "@/app/actions/rituel";
import { currentMonth } from "@/lib/rituel-calendar";
import { RitualWizard } from "@/components/RitualWizard";

export const dynamic = "force-dynamic";

const DEFAULT_ANSWERS = {
  quoiDeNeuf: "",
  promos: "",
  evenements: "",
  contraintes: "",
  nombrePublications: 8,
};

export default async function RituelPage({
  searchParams,
}: {
  searchParams: Promise<{ compte?: string }>;
}) {
  const { compte } = await searchParams;
  const allAccounts = await db.select().from(accounts);

  if (allAccounts.length === 0) {
    return (
      <div>
        <h1 className="font-display text-4xl italic">Rituel mensuel</h1>
        <p className="card mt-8 p-8 text-center text-ink/60">
          Crée d&apos;abord une <Link href="/marques" className="font-semibold text-accent underline">marque</Link>{" "}
          pour préparer son calendrier éditorial.
        </p>
      </div>
    );
  }

  const accountId = compte ? Number(compte) : allAccounts[0].id;
  const account = allAccounts.find((a) => a.id === accountId) ?? allAccounts[0];
  const month = currentMonth();

  const { id } = await demarrerRituel(account.id, month);
  const [ritual] = await db.select().from(monthlyRituals).where(eq(monthlyRituals.id, id));

  const answers = ritual?.answers ? { ...DEFAULT_ANSWERS, ...JSON.parse(ritual.answers) } : DEFAULT_ANSWERS;
  const proposal = ritual?.proposal ? JSON.parse(ritual.proposal) : [];

  return (
    <div>
      <h1 className="font-display text-4xl italic">Rituel mensuel</h1>
      <p className="mt-1 text-ink/60">
        15 minutes pour préparer le calendrier éditorial de {account.name} — {month}.
      </p>

      {allAccounts.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {allAccounts.map((a) => (
            <Link
              key={a.id}
              href={`/rituel?compte=${a.id}`}
              className={`tag ${a.id === account.id ? "bg-ink text-paper" : ""}`}
              style={a.id === account.id ? {} : { borderColor: a.color }}
            >
              {a.name}
            </Link>
          ))}
        </div>
      )}

      <RitualWizard
        ritualId={id}
        status={ritual?.status ?? "brouillon"}
        answers={answers}
        proposal={proposal}
      />
    </div>
  );
}
