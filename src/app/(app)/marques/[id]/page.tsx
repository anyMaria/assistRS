import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  db,
  accounts,
  brandProfiles,
  brandIdentity,
  brandEditorial,
  brandAssets,
  brandMemoryRules,
} from "@/db";
import {
  updateBrandContext,
  updateBrandIdentity,
  updateBrandEditorial,
  addMemoryRule,
  toggleMemoryRule,
  deleteMemoryRule,
  deleteBrandAsset,
} from "@/app/actions/brand";
import { deleteAccountAndRedirect } from "@/app/actions/accounts";
import { ContexteTab } from "@/components/brand/ContexteTab";
import { IdentiteTab } from "@/components/brand/IdentiteTab";
import { EditorialTab } from "@/components/brand/EditorialTab";
import { MemoireTab } from "@/components/brand/MemoireTab";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "contexte", label: "Contexte d'entreprise" },
  { key: "identite", label: "Identité visuelle" },
  { key: "editorial", label: "Ligne éditoriale" },
  { key: "memoire", label: "Mémoire de corrections" },
] as const;

export default async function MarqueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onglet?: string; assetError?: string }>;
}) {
  const { id } = await params;
  const accountId = Number(id);
  const { onglet, assetError } = await searchParams;
  const activeTab = TABS.find((t) => t.key === onglet)?.key ?? "contexte";

  const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
  if (!account) notFound();

  const [profile] = await db.select().from(brandProfiles).where(eq(brandProfiles.accountId, accountId));
  const [identity] = await db.select().from(brandIdentity).where(eq(brandIdentity.accountId, accountId));
  const [editorial] = await db.select().from(brandEditorial).where(eq(brandEditorial.accountId, accountId));
  const assets = await db.select().from(brandAssets).where(eq(brandAssets.accountId, accountId));
  const memoryRules = await db.select().from(brandMemoryRules).where(eq(brandMemoryRules.accountId, accountId));

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 shrink-0 border border-ink" style={{ backgroundColor: account.color }} />
        <h1 className="font-display text-4xl">{account.name}</h1>
      </div>
      <p className="mt-1 text-ink/60">
        <Link href="/marques" className="underline underline-offset-2">← Toutes les marques</Link>
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-1 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/marques/${accountId}?onglet=${t.key}`}
            className={`-mb-0.5 border-2 border-b-0 px-3 py-1.5 text-sm font-semibold ${
              activeTab === t.key ? "border-ink bg-white" : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "contexte" && (
        <ContexteTab account={account} profile={profile} action={updateBrandContext.bind(null, accountId)} />
      )}
      {activeTab === "identite" && (
        <IdentiteTab
          identity={identity}
          assets={assets}
          accountId={accountId}
          action={updateBrandIdentity.bind(null, accountId)}
          deleteAssetAction={deleteBrandAsset.bind(null, accountId)}
          assetError={assetError}
          blobConfigured={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
        />
      )}
      {activeTab === "editorial" && (
        <EditorialTab editorial={editorial} action={updateBrandEditorial.bind(null, accountId)} />
      )}
      {activeTab === "memoire" && (
        <MemoireTab
          rules={memoryRules}
          addAction={addMemoryRule.bind(null, accountId)}
          toggleAction={toggleMemoryRule.bind(null, accountId)}
          deleteAction={deleteMemoryRule.bind(null, accountId)}
        />
      )}

      <div className="mt-10 border-t border-line pt-4">
        <form action={deleteAccountAndRedirect.bind(null, accountId)}>
          <button type="submit" className="text-sm font-semibold text-danger underline underline-offset-2">
            Supprimer cette marque (et ses publications)
          </button>
        </form>
      </div>
    </div>
  );
}
