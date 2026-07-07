import type { ColorRule } from "@/db/schema";

/**
 * Moteur de couleurs conditionnelles (façon Notion).
 * Chaque ligne/carte expose des champs (status, platform, format, deadline en jours…) ;
 * la première règle qui matche donne sa couleur.
 */
export type RuleRow = Record<string, string | number | null | undefined>;
export type Condition = { field: string; operator: string; value: string };

export const OPERATORS = [
  { value: "egal", label: "est égal à" },
  { value: "different", label: "est différent de" },
  { value: "inferieur", label: "est inférieur à" },
  { value: "superieur", label: "est supérieur à" },
] as const;

export function operatorLabel(op: string): string {
  return OPERATORS.find((o) => o.value === op)?.label ?? op;
}

/** Vrai si `row` satisfait la condition — réutilisé par les couleurs ET les filtres de vue. */
export function matchesCondition(condition: Condition, row: RuleRow): boolean {
  const raw = row[condition.field];
  if (raw === null || raw === undefined) return false;
  switch (condition.operator) {
    case "egal":
      return String(raw) === condition.value;
    case "different":
      return String(raw) !== condition.value;
    case "inferieur":
      return Number(raw) < Number(condition.value);
    case "superieur":
      return Number(raw) > Number(condition.value);
    default:
      return false;
  }
}

/** Retourne la couleur de la première règle qui matche, ou null. */
export function evaluateColor(rules: ColorRule[], entity: string, row: RuleRow): string | null {
  for (const rule of rules) {
    if (rule.entity !== entity) continue;
    if (matchesCondition(rule, row)) return rule.color;
  }
  return null;
}

/** Champs proposés dans l'éditeur de règles, par entité. */
export const RULE_FIELDS: Record<string, { value: string; label: string; hint?: string }[]> = {
  idees: [
    { value: "status", label: "Statut", hint: "idee, en_production, publiee" },
    { value: "account", label: "Marque", hint: "nom de la marque" },
    { value: "platform", label: "Plateforme", hint: "instagram, facebook, linkedin" },
    { value: "format", label: "Format", hint: "carrousel, reel, story, post" },
    { value: "pillar", label: "Pilier", hint: "pilier de la ligne éditoriale" },
    { value: "feasibility", label: "Faisabilité", hint: "faible, moyenne, elevee" },
    { value: "source", label: "Source", hint: "ia, manuelle" },
  ],
  publications: [
    { value: "status", label: "Statut", hint: "planifiee, publiee" },
    { value: "account", label: "Marque", hint: "nom de la marque" },
    { value: "platform", label: "Plateforme", hint: "instagram, facebook, linkedin" },
    { value: "format", label: "Format", hint: "carrousel, reel, story, post" },
    { value: "deadline", label: "Deadline visuel (jours restants)", hint: "nombre de jours, ex. 2" },
    { value: "engagementRate", label: "Taux d'engagement (%)", hint: "ex. 3" },
  ],
};
