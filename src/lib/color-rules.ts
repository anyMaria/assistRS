import type { ColorRule } from "@/db/schema";

/**
 * Moteur de couleurs conditionnelles (façon Notion).
 * Chaque ligne/carte expose des champs (status, platform, format, deadline en jours…) ;
 * la première règle qui matche donne sa couleur.
 */
export type RuleRow = Record<string, string | number | null | undefined>;

export const OPERATORS = [
  { value: "egal", label: "est égal à" },
  { value: "different", label: "est différent de" },
  { value: "inferieur", label: "est inférieur à" },
  { value: "superieur", label: "est supérieur à" },
] as const;

export function operatorLabel(op: string): string {
  return OPERATORS.find((o) => o.value === op)?.label ?? op;
}

function matches(rule: ColorRule, row: RuleRow): boolean {
  const raw = row[rule.field];
  if (raw === null || raw === undefined) return false;
  switch (rule.operator) {
    case "egal":
      return String(raw) === rule.value;
    case "different":
      return String(raw) !== rule.value;
    case "inferieur":
      return Number(raw) < Number(rule.value);
    case "superieur":
      return Number(raw) > Number(rule.value);
    default:
      return false;
  }
}

/** Retourne la couleur de la première règle qui matche, ou null. */
export function evaluateColor(rules: ColorRule[], entity: string, row: RuleRow): string | null {
  for (const rule of rules) {
    if (rule.entity !== entity) continue;
    if (matches(rule, row)) return rule.color;
  }
  return null;
}

/** Champs proposés dans l'éditeur de règles, par entité. */
export const RULE_FIELDS: Record<string, { value: string; label: string; hint?: string }[]> = {
  idees: [
    { value: "status", label: "Statut", hint: "idee, en_production, publiee" },
    { value: "platform", label: "Plateforme", hint: "instagram, facebook, linkedin" },
    { value: "format", label: "Format", hint: "carrousel, reel, story, post" },
    { value: "source", label: "Source", hint: "ia, manuelle" },
  ],
  publications: [
    { value: "status", label: "Statut", hint: "planifiee, publiee" },
    { value: "platform", label: "Plateforme", hint: "instagram, facebook, linkedin" },
    { value: "format", label: "Format", hint: "carrousel, reel, story, post" },
    { value: "deadline", label: "Deadline visuel (jours restants)", hint: "nombre de jours, ex. 2" },
    { value: "engagementRate", label: "Taux d'engagement (%)", hint: "ex. 3" },
  ],
};
