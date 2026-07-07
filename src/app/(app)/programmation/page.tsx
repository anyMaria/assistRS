import { redirect } from "next/navigation";

export default async function ProgrammationRedirect({
  searchParams,
}: {
  searchParams: Promise<{ plateforme?: string; type?: string }>;
}) {
  const { plateforme, type } = await searchParams;
  const qs = new URLSearchParams();
  if (plateforme) qs.set("plateforme", plateforme);
  if (type) qs.set("type", type);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/parametres${suffix}#horaires`);
}
