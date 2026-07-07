export default function ChargementSInspirer() {
  return (
    <div>
      <div className="h-10 w-64 animate-pulse bg-ink/10" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse bg-ink/10" />
      <div className="mt-6 grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="card h-64 animate-pulse bg-ink/5" />
        <div className="card h-24 animate-pulse bg-ink/5" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-64 animate-pulse bg-ink/5" />
        ))}
      </div>
    </div>
  );
}
