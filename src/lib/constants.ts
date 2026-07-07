// Libellés et listes partagés (interface 100 % français)

export const PLATFORMS = [
  { value: "instagram", label: "Instagram", color: "#B13589" },
  { value: "facebook", label: "Facebook", color: "#1877F2" },
  { value: "linkedin", label: "LinkedIn", color: "#0A66C2" },
] as const;

export const FORMATS = [
  { value: "carrousel", label: "Carrousel" },
  { value: "reel", label: "Reel" },
  { value: "story", label: "Story" },
  { value: "post", label: "Post simple" },
] as const;

export const OBJECTIVES = [
  { value: "notoriete", label: "Notoriété" },
  { value: "engagement", label: "Engagement" },
  { value: "conversion", label: "Conversion" },
] as const;

export const IDEA_STATUSES = [
  { value: "idee", label: "Idée" },
  { value: "en_production", label: "En production" },
  { value: "publiee", label: "Publiée" },
] as const;

export const PUBLICATION_STATUSES = [
  { value: "planifiee", label: "Planifiée" },
  { value: "publiee", label: "Publiée" },
] as const;

export const CONTENT_TYPES = [
  { value: "post", label: "Posts" },
  { value: "reel", label: "Reels" },
  { value: "story", label: "Stories" },
] as const;

export const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
export const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export const PRODUCTION_STEPS = [
  { key: "brief", label: "Brief" },
  { key: "maquette", label: "Maquette" },
  { key: "envoye", label: "Envoyé au client" },
  { key: "valide", label: "Validé" },
  { key: "programme", label: "Programmé" },
] as const;

export const RECURRENCE_FREQS = [
  { value: "hebdo", label: "Chaque semaine" },
  { value: "mensuel", label: "Chaque mois" },
] as const;

export const GOAL_METRICS = [
  { value: "abonnes", label: "Abonnés gagnés" },
  { value: "engagement", label: "Taux d'engagement" },
  { value: "conversions", label: "Conversions" },
] as const;

export const STAT_FIELDS = [
  { value: "impressions", label: "Impressions" },
  { value: "reach", label: "Portée" },
  { value: "likes", label: "J'aime" },
  { value: "comments", label: "Commentaires" },
  { value: "shares", label: "Partages" },
  { value: "saves", label: "Enregistrements" },
  { value: "clicks", label: "Clics" },
  { value: "followersGained", label: "Abonnés gagnés" },
  { value: "conversions", label: "Conversions (contacts/ventes)" },
] as const;

export function platformLabel(value: string): string {
  return PLATFORMS.find((p) => p.value === value)?.label ?? value;
}
export function platformColor(value: string): string {
  return PLATFORMS.find((p) => p.value === value)?.color ?? "#1C1917";
}
export function formatLabel(value: string): string {
  return FORMATS.find((f) => f.value === value)?.label ?? value;
}
export function ideaStatusLabel(value: string): string {
  return IDEA_STATUSES.find((s) => s.value === value)?.label ?? value;
}
export function publicationStatusLabel(value: string): string {
  return PUBLICATION_STATUSES.find((s) => s.value === value)?.label ?? value;
}
export function goalMetricLabel(value: string): string {
  return GOAL_METRICS.find((m) => m.value === value)?.label ?? value;
}
export function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m}`;
}

export function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
export function formatDateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
