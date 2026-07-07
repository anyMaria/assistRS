// Rappel de format d'export par type de contenu (CONCEPTION.md §4.4).
// Règle d'or : toujours ré-exporter depuis le fichier source, jamais convertir un export.
export const EXPORT_FORMATS = [
  { contenu: "Post/carrousel IG & FB", format: "PNG (ou JPG qualité max)", dimensions: "1080 × 1350 (4:5)" },
  { contenu: "Reel / Story", format: "MP4 H.264 / PNG story fixe", dimensions: "1080 × 1920 (9:16)" },
  { contenu: "Post LinkedIn", format: "PNG", dimensions: "1200 × 627 ou 1080 × 1350" },
  { contenu: "Carrousel LinkedIn", format: "PDF (document natif)", dimensions: "1080 × 1080 ou 1080 × 1350" },
  { contenu: "Épingle Pinterest", format: "PNG", dimensions: "1000 × 1500 (2:3)" },
] as const;
