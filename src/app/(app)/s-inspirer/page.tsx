import { redirect } from "next/navigation";

export default async function SInspirerRedirect({
  searchParams,
}: {
  searchParams: Promise<{ recherche?: string }>;
}) {
  const { recherche } = await searchParams;
  redirect(`/conception?onglet=inspirer${recherche ? `&recherche=${recherche}` : ""}`);
}
