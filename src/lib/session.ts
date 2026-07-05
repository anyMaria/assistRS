/**
 * Session par cookie signé HMAC (Web Crypto — compatible Edge middleware).
 * Valeur du cookie : "<expiration unix>.<signature hex>"
 */
const COOKIE_NAME = "assistrs_session";
const SESSION_DAYS = 30;

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET manquant dans les variables d'environnement");
  return s;
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionValue(): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 3600;
  const sig = await hmac(String(expires));
  return `${expires}.${sig}`;
}

export async function verifySessionValue(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [expires, sig] = value.split(".");
  if (!expires || !sig) return false;
  if (Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmac(expires);
  return sig === expected;
}

export const sessionCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_DAYS * 24 * 3600,
};
