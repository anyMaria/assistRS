import { desc } from "drizzle-orm";
import { Nav } from "@/components/Nav";
import { CommandPalette } from "@/components/CommandPalette";
import { QuickCapture } from "@/components/QuickCapture";
import { db, accounts, brandEditorial, publications } from "@/db";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [allAccounts, editorials, recentPublications] = await Promise.all([
    db.select().from(accounts),
    db.select().from(brandEditorial),
    db
      .select({
        id: publications.id,
        accountId: publications.accountId,
        title: publications.title,
        platform: publications.platform,
      })
      .from(publications)
      .orderBy(desc(publications.id))
      .limit(200),
  ]);

  const pillarsByAccount: Record<number, string[]> = {};
  for (const ed of editorials) {
    try {
      const pillars: { name: string }[] = JSON.parse(ed.pillars || "[]");
      pillarsByAccount[ed.accountId] = pillars.map((p) => p.name).filter(Boolean);
    } catch {
      pillarsByAccount[ed.accountId] = [];
    }
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="md:ml-56 px-4 md:px-8 py-6 pb-24 md:pb-10 max-w-6xl">
        {children}
      </main>
      <CommandPalette />
      <QuickCapture
        accounts={allAccounts}
        pillarsByAccount={pillarsByAccount}
        publications={recentPublications}
      />
    </div>
  );
}
