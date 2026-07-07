import Link from "next/link";
import { inArray, desc } from "drizzle-orm";
import { db, accounts, inspirationSearches, inspirationItems, moodboards } from "@/db";
import { SearchForm } from "@/components/inspiration/SearchForm";
import { BudgetBar } from "@/components/inspiration/BudgetBar";
import { PollStatus } from "@/components/inspiration/PollStatus";
import { RelancerButton } from "@/components/inspiration/RelancerButton";
import { ItemCard } from "@/components/inspiration/ItemCard";
import { monthlySpendCents } from "@/lib/api-usage";
import { ACTORS, type ApifySource } from "@/lib/apify";
import { formatDateTime } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function SInspirerPage({
  searchParams,
}: {
  searchParams: Promise<{ recherche?: string }>;
}) {
  const { recherche } = await searchParams;
  const ids = (recherche ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);

  const [allAccounts, allMoodboards, spend] = await Promise.all([
    db.select().from(accounts),
    db.select().from(moodboards),
    monthlySpendCents("apify"),
  ]);

  const searches = ids.length
    ? await db
        .select()
        .from(inspirationSearches)
        .where(inArray(inspirationSearches.id, ids))
        .orderBy(desc(inspirationSearches.createdAt))
    : [];
  const items = searches.length
    ? await db
        .select()
        .from(inspirationItems)
        .where(inArray(inspirationItems.searchId, searches.map((s) => s.id)))
    : [];
  const itemsBySearch = new Map<number, typeof items>();
  for (const it of items) {
    const list = itemsBySearch.get(it.searchId) ?? [];
    list.push(it);
    itemsBySearch.set(it.searchId, list);
  }

  return (
    <div>
      <h1 className="font-display text-4xl italic">S&apos;inspirer</h1>
      <p className="mt-1 text-ink/60">
        Recherche visuelle par thème — Pinterest, Instagram, LinkedIn, Facebook, Meta Ad Library.
      </p>

      <div className="mt-6 grid items-start gap-4 md:grid-cols-[2fr_1fr]">
        <SearchForm accounts={allAccounts} defaultTheme={searches[0]?.theme ?? ""} />
        <BudgetBar spendCents={spend} />
      </div>

      <div className="mt-4">
        <Link href="/s-inspirer/moodboards" className="text-sm font-semibold text-accent underline underline-offset-2">
          Voir les moodboards →
        </Link>
      </div>

      {searches.length === 0 ? (
        <p className="card mt-8 p-6 text-ink/60">
          Lance ta première recherche : choisis un thème et au moins une source ci-dessus.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {searches.map((search) => {
            const meta = ACTORS[search.source as ApifySource];
            const searchItems = itemsBySearch.get(search.id) ?? [];
            const boardsForSearch = search.accountId
              ? allMoodboards.filter((m) => m.accountId === search.accountId || m.accountId === null)
              : allMoodboards;
            return (
              <section key={search.id} className="card">
                <header className="flex flex-wrap items-center gap-3 border-b-2 border-ink p-4">
                  <span className="tag">{meta.label}</span>
                  <span className="font-semibold">{search.theme}</span>
                  {search.status === "termine" && searchItems.length > 0 && (
                    <span className="text-sm text-ink/50">
                      {searchItems.length} résultats · {formatDateTime(search.createdAt)}
                      {search.costCents === 0
                        ? " (cache gratuit)"
                        : ` · ${(search.costCents / 100).toFixed(2)} $`}
                    </span>
                  )}
                  <div className="ml-auto">
                    <RelancerButton searchId={search.id} />
                  </div>
                </header>

                {search.status === "en_cours" && <PollStatus searchId={search.id} />}

                {search.status === "erreur" && (
                  <div className="card p-4" style={{ borderColor: "var(--color-danger)" }}>
                    <p className="flex items-center gap-2 font-semibold text-danger">
                      <span aria-hidden>⚠</span> {search.errorMessage ?? "La recherche a échoué."}
                    </p>
                  </div>
                )}

                {search.status === "termine" && searchItems.length === 0 && (
                  <p className="p-4 text-sm italic text-ink/50">
                    {search.errorMessage ?? "Aucun résultat."}
                  </p>
                )}

                {search.status === "termine" && searchItems.length > 0 && (
                  <div className="columns-1 gap-4 p-4 sm:columns-2 lg:columns-3">
                    {searchItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        moodboards={boardsForSearch}
                        accountId={search.accountId}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
