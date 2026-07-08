/**
 * Vrai si Vercel Blob est accessible pour ce runtime.
 *
 * Deux modèles coexistent : l'ancien (token statique `BLOB_READ_WRITE_TOKEN`, ce que
 * documentait GUIDELINE.md §8) et le nouveau (store connecté au projet → Vercel injecte
 * `BLOB_STORE_ID` et authentifie via OIDC à l'exécution, sans token statique). Un store
 * créé via Storage → Create → Blob dans le dashboard n'expose plus forcément
 * `BLOB_READ_WRITE_TOKEN` : vérifier les deux évite de désactiver l'upload à tort.
 */
export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}
