import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-7xl italic text-accent">404</p>
      <h1 className="mt-4 font-display text-3xl italic">Cette page s&apos;est égarée</h1>
      <p className="mt-2 max-w-sm text-ink/60">
        Le lien est peut-être ancien, ou l&apos;adresse mal tapée. Rien n&apos;est perdu
        de ton côté.
      </p>
      <Link href="/" className="btn btn-accent mt-6">
        ← Retour à l&apos;accueil
      </Link>
    </div>
  );
}
