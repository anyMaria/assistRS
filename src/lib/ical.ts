/** Génération .ics à la main (pas de dépendance iCal — voir GUIDELINE.md §9). */

export type IcsEvent = { uid: string; date: Date; summary: string };

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

/** Plie les lignes de plus de 75 caractères avec un retour CRLF + espace. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  let result = "";
  let rest = line;
  while (rest.length > 75) {
    result += `${rest.slice(0, 75)}\r\n `;
    rest = rest.slice(75);
  }
  return result + rest;
}

function dateStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

export function buildIcs(events: IcsEvent[]): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Assist RS//FR"];
  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${e.uid}@assistrs`));
    lines.push(`DTSTART;VALUE=DATE:${dateStamp(e.date)}`);
    lines.push(foldLine(`SUMMARY:${escapeIcsText(e.summary)}`));
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
