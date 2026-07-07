import type { BrandEditorial } from "@/db/schema";
import { ListEditor } from "@/components/ListEditor";
import { SubmitButton } from "@/components/SubmitButton";

function parse<T>(json: string | undefined, fallback: T): T {
  try {
    return json ? JSON.parse(json) : fallback;
  } catch {
    return fallback;
  }
}

export function EditorialTab({
  editorial,
  action,
}: {
  editorial?: BrandEditorial;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="mt-5 space-y-8">
      <label>
        <span className="field-label">Message principal</span>
        <textarea name="mainMessage" rows={2} defaultValue={editorial?.mainMessage ?? ""} className="field" />
      </label>

      <section>
        <h3 className="font-display text-xl">Messages secondaires</h3>
        <div className="mt-2">
          <ListEditor
            name="secondaryMessages"
            fields={[{ key: "value", label: "Message" }]}
            defaultItems={parse<string[]>(editorial?.secondaryMessages, []).map((v) => ({ value: v }))}
            addLabel="+ Ajouter un message"
          />
        </div>
      </section>

      <section>
        <h3 className="font-display text-xl">Piliers de contenu</h3>
        <p className="mt-1 text-xs text-ink/50">Ex. Coulisses 30 % / Pédagogie 40 % / Offre 20 % / Communauté 10 %.</p>
        <div className="mt-2">
          <ListEditor
            name="pillars"
            fields={[
              { key: "name", label: "Pilier" },
              { key: "sharePercent", label: "Part (%)" },
            ]}
            defaultItems={parse(editorial?.pillars, [])}
            addLabel="+ Ajouter un pilier"
          />
        </div>
      </section>

      <label>
        <span className="field-label">Ton de voix</span>
        <textarea name="toneVoice" rows={2} defaultValue={editorial?.toneVoice ?? ""} className="field" />
      </label>

      <section>
        <h3 className="font-display text-xl">Exemples de ton</h3>
        <div className="mt-2">
          <ListEditor
            name="toneExamples"
            fields={[
              { key: "onDit", label: "On dit" },
              { key: "onNeDitPas", label: "On ne dit pas" },
            ]}
            defaultItems={parse(editorial?.toneExamples, [])}
            addLabel="+ Ajouter un exemple"
          />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h3 className="font-display text-xl">Do&apos;s</h3>
          <div className="mt-2">
            <ListEditor
              name="dos"
              fields={[{ key: "value", label: "Règle" }]}
              defaultItems={parse<string[]>(editorial?.dos, []).map((v) => ({ value: v }))}
              addLabel="+ Ajouter"
            />
          </div>
        </section>
        <section>
          <h3 className="font-display text-xl">Don&apos;ts</h3>
          <div className="mt-2">
            <ListEditor
              name="donts"
              fields={[{ key: "value", label: "Règle" }]}
              defaultItems={parse<string[]>(editorial?.donts, []).map((v) => ({ value: v }))}
              addLabel="+ Ajouter"
            />
          </div>
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h3 className="font-display text-xl">Hashtags de base</h3>
          <div className="mt-2">
            <ListEditor
              name="baseHashtags"
              fields={[{ key: "value", label: "#hashtag" }]}
              defaultItems={parse<string[]>(editorial?.baseHashtags, []).map((v) => ({ value: v }))}
              addLabel="+ Ajouter"
            />
          </div>
        </section>
        <section>
          <h3 className="font-display text-xl">Hashtags interdits</h3>
          <div className="mt-2">
            <ListEditor
              name="bannedHashtags"
              fields={[{ key: "value", label: "#hashtag" }]}
              defaultItems={parse<string[]>(editorial?.bannedHashtags, []).map((v) => ({ value: v }))}
              addLabel="+ Ajouter"
            />
          </div>
        </section>
      </div>

      <label>
        <span className="field-label">Politique émojis</span>
        <select name="emojiPolicy" defaultValue={editorial?.emojiPolicy ?? "parcimonie"} className="field md:w-64">
          <option value="jamais">Jamais</option>
          <option value="parcimonie">Avec parcimonie</option>
          <option value="librement">Librement</option>
        </select>
      </label>

      <section>
        <h3 className="font-display text-xl">CTA récurrents</h3>
        <div className="mt-2">
          <ListEditor
            name="ctas"
            fields={[{ key: "value", label: "CTA" }]}
            defaultItems={parse<string[]>(editorial?.ctas, []).map((v) => ({ value: v }))}
            addLabel="+ Ajouter"
          />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="field-label">Langue(s) de publication</span>
          <input name="languages" defaultValue={editorial?.languages ?? "fr"} className="field" />
        </label>
        <label>
          <span className="field-label">Mentions obligatoires (légales, crédits photo)</span>
          <input name="legalMentions" defaultValue={editorial?.legalMentions ?? ""} className="field" />
        </label>
      </div>

      <SubmitButton label="Enregistrer la ligne éditoriale" />
    </form>
  );
}
