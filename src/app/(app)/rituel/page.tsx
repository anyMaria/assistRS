import { redirect } from "next/navigation";

export default async function RituelRedirect({
  searchParams,
}: {
  searchParams: Promise<{ compte?: string }>;
}) {
  const { compte } = await searchParams;
  redirect(`/bilan?onglet=rituel${compte ? `&compte=${compte}` : ""}`);
}
