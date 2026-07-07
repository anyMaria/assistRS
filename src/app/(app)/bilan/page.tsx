import Link from "next/link";
import { buildBilanData } from "@/lib/bilan";
import { platformLabel, platformColor, formatDate } from "@/lib/constants";
import { deadlineMessage } from "@/lib/deadline";
import { formatRate } from "@/lib/kpi";

export const dynamic = "force-dynamic";

export default async function BilanPage() {
  const { deadlinesSemaine, toRelaunch, toFollowUp, highlights } = await buildBilanData();

  return (
    <div>
      <h1 className="font-display text-4xl italic">Bilan</h1>
      <p className="mt-1 text-ink/60">
        Le digest hebdo — envoyé par e-mail chaque lundi, toujours disponible ici.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Deadlines de la semaine</h2>
        {deadlinesSemaine.length === 0 ? (
          <p className="mt-2 text-ink/50 italic">Rien en attente cette semaine.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {deadlinesSemaine.map(({ pub, account, deadline, status }) => (
              <li
                key={pub.id}
                className="card flex flex-wrap items-center gap-2 p-3"
                style={{
                  borderLeftWidth: 8,
                  borderLeftColor: status === "depassee" ? "#7A1512" : status === "proche" ? "#D97706" : (account?.color ?? "#1C1917"),
                }}
              >
                <span className="tag text-white" style={{ backgroundColor: platformColor(pub.platform), borderColor: "transparent" }}>
                  {platformLabel(pub.platform)}
                </span>
                <span className="font-semibold">{pub.title || "Sans titre"}</span>
                <span className="text-sm text-ink/50">{account?.name}</span>
                <span
                  className={`ml-auto text-sm font-semibold ${
                    status === "depassee" ? "text-danger" : status === "proche" ? "text-warn" : "text-ink/70"
                  }`}
                >
                  {deadlineMessage(deadline)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">À relancer</h2>
        {toRelaunch.length === 0 ? (
          <p className="mt-2 text-ink/50 italic">Aucune validation en retard.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {toRelaunch.map(({ pub, account, daysSinceSent }) => (
              <li key={pub.id} className="card flex flex-wrap items-center gap-2 p-3" style={{ borderLeftWidth: 8, borderLeftColor: "#D97706" }}>
                <span className="tag text-white" style={{ backgroundColor: platformColor(pub.platform), borderColor: "transparent" }}>
                  {platformLabel(pub.platform)}
                </span>
                <span className="font-semibold">{pub.title || "Sans titre"}</span>
                <span className="text-sm text-ink/50">{account?.name}</span>
                <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-warn">
                  <span aria-hidden>⚠</span> Envoyé il y a {daysSinceSent} j sans validation
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">À relever</h2>
        {toFollowUp.length === 0 ? (
          <p className="mt-2 text-ink/50 italic">Tous les relevés sont à jour.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {toFollowUp.map(({ pub, account, daysSincePublished, daysSinceLastSnapshot }) => (
              <li key={pub.id} className="card flex flex-wrap items-center gap-2 p-3">
                <span className="tag text-white" style={{ backgroundColor: platformColor(pub.platform), borderColor: "transparent" }}>
                  {platformLabel(pub.platform)}
                </span>
                <span className="font-semibold">{pub.title || "Sans titre"}</span>
                <span className="text-sm text-ink/50">{account?.name}</span>
                <span className="ml-auto text-sm text-ink/70">
                  {daysSinceLastSnapshot === null
                    ? `Publiée il y a ${daysSincePublished} j, aucun relevé`
                    : `Dernier relevé il y a ${daysSinceLastSnapshot} j`}
                </span>
                <Link href="/statistiques" className="btn text-xs">＋ Relever</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Stats marquantes de la semaine passée</h2>
        {highlights.length === 0 ? (
          <p className="mt-2 text-ink/50 italic">Pas de relevé marquant cette semaine.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {highlights.map(({ pub, account, snapshot, rate }) => (
              <li key={snapshot.id} className="card flex flex-wrap items-center gap-2 p-3" style={{ borderLeftWidth: 8, borderLeftColor: "#3D7C47" }}>
                <span className="tag text-white" style={{ backgroundColor: platformColor(pub.platform), borderColor: "transparent" }}>
                  {platformLabel(pub.platform)}
                </span>
                <span className="font-semibold">{pub.title || "Sans titre"}</span>
                <span className="text-sm text-ink/50">{account?.name}</span>
                <span className="ml-auto text-sm font-semibold text-ok">
                  {formatRate(rate)} d&apos;engagement · {formatDate(snapshot.recordedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
