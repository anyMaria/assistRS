import { Home, Palette, PenLine, CalendarDays, BarChart3, Mail, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  mobile?: boolean;
}

/** G8 : apparence seulement — la liste des entrées de nav sera restructurée en G9. */
export const navItems: NavItem[] = [
  { href: "/", label: "Accueil", icon: Home, mobile: true },
  { href: "/marques", label: "Marques", icon: Palette },
  { href: "/conception", label: "Conception", icon: PenLine, mobile: true },
  { href: "/planning", label: "Planifier", icon: CalendarDays, mobile: true },
  { href: "/mesurer", label: "Mesurer", icon: BarChart3, mobile: true },
  { href: "/bilan", label: "Bilan", icon: Mail, mobile: true },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];
