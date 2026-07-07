import { redirect } from "next/navigation";

export default async function IdeesRedirect({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; mois?: string }>;
}) {
  const { vue, mois } = await searchParams;
  const qs = new URLSearchParams({ onglet: "idees" });
  if (vue) qs.set("vue", vue);
  if (mois) qs.set("mois", mois);
  redirect(`/conception?${qs.toString()}`);
}
