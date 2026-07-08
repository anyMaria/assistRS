import { desc } from "drizzle-orm";
import { Sidebar } from "@/components/shell/Sidebar";
import { MobileNav } from "@/components/shell/MobileNav";
import { Topbar } from "@/components/shell/Topbar";
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
    <div className="flex h-screen w-full overflow-hidden bg-paper text-ink">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar accounts={allAccounts} pillarsByAccount={pillarsByAccount} publications={recentPublications} />
        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6 md:px-8 md:pb-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
