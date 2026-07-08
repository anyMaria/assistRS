import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import {
  db,
  accounts,
  brandProfiles,
  brandIdentity,
  brandEditorial,
  brandAssets,
  brandMemoryRules,
  brandClientNotes,
  publications,
} from "@/db";
import {
  updateBrandContext,
  updateBrandIdentity,
  updateBrandEditorial,
  addMemoryRule,
  toggleMemoryRule,
  deleteMemoryRule,
  deleteBrandAsset,
  addClientNote,
  deleteClientNote,
} from "@/app/actions/brand";
import { deleteAccountAndRedirect } from "@/app/actions/accounts";
import { SectionHeader } from "@/components/SectionHeader";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { ContexteTab } from "@/components/brand/ContexteTab";
import { IdentiteTab } from "@/components/brand/IdentiteTab";
import { EditorialTab } from "@/components/brand/EditorialTab";
import { MemoireTab } from "@/components/brand/MemoireTab";
import { RetoursTab } from "@/components/brand/RetoursTab";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "contexte", label: "Contexte d'entreprise" },
  { key: "identite", label: "Identité visuelle" },
  { key: "editorial", label: "Ligne éditoriale" },
  { key: "memoire", label: "Mémoire de corrections" },
  { key: "retours", label: "Retours client" },
] as const;

export default async function MarqueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onglet?: string; assetError?: string; reglePreremplie?: string; origine?: string }>;
}) {
  const { id } = await params;
  const accountId = Number(id);
  const { onglet, assetError, reglePreremplie, origine } = await searchParams;
  const activeTab = TABS.find((t) => t.key === onglet)?.key ?? "contexte";

  const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
  if (!account) notFound();

  const [profile] = await db.select().from(brandProfiles).where(eq(brandProfiles.accountId, accountId));
  const [identity] = await db.select().from(brandIdentity).where(eq(brandIdentity.accountId, accountId));
  const [editorial] = await db.select().from(brandEditorial).where(eq(brandEditorial.accountId, accountId));
  const assets = await db.select().from(brandAssets).where(eq(brandAssets.accountId, accountId));
  const memoryRules = await db.select().from(brandMemoryRules).where(eq(brandMemoryRules.accountId, accountId));
  const clientNotes = await db
    .select()
    .from(brandClientNotes)
    .where(eq(brandClientNotes.accountId, accountId))
    .orderBy(desc(brandClientNotes.createdAt));
  const accountPublications = await db
    .select({ id: publications.id, title: publications.title, platform: publications.platform })
    .from(publications)
    .where(eq(publications.accountId, accountId))
    .orderBy(desc(publications.id));

  return (
    <div>
      <SectionHeader
        title={
          <span className="flex items-center gap-3">
            <span className="brand-chip" style={{ backgroundColor: account.color }} />
            {account.name}
          </span>
        }
        subtitle={
          <Link href="/marques" className="underline underline-offset-2">← Toutes les marques</Link>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-1 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/marques/${accountId}?onglet=${t.key}`}
            className={`-mb-0.5 flex items-center gap-1.5 border border-b-0 px-3 py-1.5 text-sm font-semibold ${
              activeTab === t.key ? "border-line bg-surface text-ink" : "border-transparent text-ink/50 hover:text-ink"
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
          prefillRule={reglePreremplie}
          prefillOrigin={origine}
        />
      )}
      {activeTab === "retours" && (
        <RetoursTab
          accountId={accountId}
          notes={clientNotes}
          publications={accountPublications}
          addAction={addClientNote.bind(null, accountId)}
          deleteAction={deleteClientNote.bind(null, accountId)}
        />
      )}

      <div className="mt-10 border-t border-line pt-4">
        <ConfirmDeleteButton
          action={deleteAccountAndRedirect.bind(null, accountId)}
          confirmMessage={`Supprimer « ${account.name} » et toutes ses publications ?`}
          className="btn text-sm text-danger"
        >
          Supprimer cette marque (et ses publications)
        </ConfirmDeleteButton>
      </div>
    </div>
  );
}
