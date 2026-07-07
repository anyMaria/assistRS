import { redirect } from "next/navigation";

export default async function AnalyseRedirect({
  searchParams,
}: {
  searchParams: Promise<{ compte?: string }>;
}) {
  const { compte } = await searchParams;
  redirect(`/bilan?onglet=mois${compte ? `&compte=${compte}` : ""}`);
}
