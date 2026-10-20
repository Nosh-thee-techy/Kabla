import { useState } from "react";
import { t, type Lang } from "../i18n";

const STEPS = {
  en: {
    desk: [
      "Pick a folder (Mawingu is the trap-heavy demo) or blot your own text.",
      "Kabla reads it into facts, then MeTTa flags traps. Nothing is signed yet.",
      "You land on the clause map. Use the rail at the top to move rooms.",
    ],
    map: [
      "Deal fairness is a flag count, not a new score — each point names a clause.",
      "Tap as-written vs best-case (if you negotiate every red) to see why the number moves.",
      "Red and amber seals mark clauses. Open one for the rule trail, then stamp on.",
    ],
    sim: [
      "Drag streams. The numbers are illustrative — not a forecast.",
      "Left is the deal as written. Right is after a fairer ask.",
      "Then sit in the theater to actually change the terms.",
    ],
    theater: [
      "Raise the curtain. Two rule agents talk; you are the only closer.",
      "Stamp Approve or Reject on every concession. Kabla never agrees for you.",
      "The checklist warns only — it does not block. Scores update after each act.",
    ],
    licence: [
      "Open an envelope: a Kenyan ad, AI training, or a film that needs Baraka.",
      "MeTTa returns cleared, not cleared, or needs consent — with a rule id.",
      "Try all three. Then seal a passport for the agreed terms.",
    ],
    passport: [
      "The pre-sign list warns if a red line, AI stance, split, or consent is missing.",
      "Consent to register (sale is a separate tick). Issue: hash, badges, score.",
      "Copy the hash if you want. Then take the certificate to customs.",
    ],
    verify: [
      "Paste certificate JSON, or run the tamper test after issuing a passport.",
      "Intact: green lamp, you may pass. Tampered: red lamp, it names the break.",
      "Change one character yourself if you want to see the clerk catch it.",
    ],
    financier: [
      "This sheet rearranges the passport: owners, open flags, AI stance, score.",
      "It is not a credit score and not lending advice. SYNTHETIC only.",
      "Each flag still names a rule id and a clause. Nothing new is decided here.",
    ],
  },
  sw: {
    desk: [
      "Chagua folda (Mawingu ndiyo mfano wenye mitego) au bandika maandishi.",
      "Kabla inasoma ukweli, kisha MeTTa inaweka bendera. Bado hujasaini.",
      "Utaingia kwenye ramani. Tumia reli juu kuhama vyumba.",
    ],
    map: [
      "Haki ya mkataba ni hesabu ya bendera, si alama mpya — kila nukta ina kifungu.",
      "Gusa kama-kilivyoandikwa dhidi ya hali-bora (ukijadili kila nyekundu) kuona kwa nini namba inabadilika.",
      "Muhuri mwekundu na wa njano unaashiria vifungu. Fungua moja kwa njia, kisha endelea.",
    ],
    sim: [
      "Sogeza idadi ya mitiririko. Hizi ni namba za mfano — si utabiri.",
      "Kushoto ni mkataba kama ulivyo. Kulia ni baada ya ombi bora.",
      "Kisha keti ukumbini kubadilisha masharti.",
    ],
    theater: [
      "Inua pazia. Mawakala wawili wanazungumza; wewe ndiye unayefunga.",
      "Piga Kubali au Kataa kila hatua. Kabla haikubali kwa niaba yako.",
      "Orodha ya kabla-ya-saini inaonya tu — haizuii. Alama zinabadilika baada ya kila kitendo.",
    ],
    licence: [
      "Fungua bahasha: tangazo la Kenya, mafunzo ya AI, au filamu inayohitaji Baraka.",
      "MeTTa inarudisha imeruhusiwa, hairuhusiwi, au inahitaji idhini — na sheria.",
      "Jaribu zote tatu. Kisha funga pasipoti ya masharti yaliyokubaliwa.",
    ],
    passport: [
      "Orodha ya kabla-ya-saini inaonya ikiwa mstari, AI, mgawanyo, au idhini inakosekana.",
      "Kubali kusajili (kuuza ni alama tofauti). Toa: hash, beji, na alama ya afya.",
      "Nakili hash ukitaka. Kisha peleka cheti forodhani.",
    ],
    verify: [
      "Bandika JSON ya cheti, au fanya jaribio la kuharibu baada ya kutoa pasipoti.",
      "Sahihi: taa kijani, unaweza kupita. Imeharibiwa: taa nyekundu, inataja kasoro.",
      "Badilisha herufi moja mwenyewe uone karani akishika.",
    ],
    financier: [
      "Karatasi hii inapanga pasipoti: wamiliki, bendera, msimamo wa AI, alama.",
      "Si alama ya mkopo wala ushauri wa kukopesha. DATA BANDIA tu.",
      "Kila bendera bado ina sheria na kifungu. Hakuna uamuzi mpya hapa.",
    ],
  },
} as const;

export type Page = keyof typeof STEPS.en;

/** Why this exists: the three-step guide used to sit at the bottom of the room and fell below the fold.
 *  Karani, the desk clerk, now sits at the top with one line on what to do right now; steps fold out. */
export function Clerk({ lang, page, say }: { lang: Lang; page: Page; say: string }) {
  const [open, setOpen] = useState(false);
  const steps = STEPS[lang][page];
  return (
    <aside className="mt-4 flex items-start gap-3 max-w-3xl" aria-label={t(lang, "karani")}>
      <KaraniFace />
      <div className="bubble flex-1 px-3.5 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta dark:text-gold">
          {t(lang, "karani")}
        </p>
        <p className="mt-0.5 text-sm leading-snug">{say}</p>
        <button
          type="button"
          className="mt-1.5 text-xs underline opacity-70 hover:opacity-100"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? t(lang, "hideSteps") : t(lang, "showSteps")}
        </button>
        {open && (
          <ol className="mt-2 space-y-1 border-t hair pt-2">
            {steps.map((line, i) => (
              <li key={i} className="text-xs leading-snug opacity-85">
                <span className="font-mono text-terracotta dark:text-gold mr-1.5">{i + 1}.</span>
                {line}
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}

/** Karani's face: paper-coloured head, round spectacles, terracotta kofia with a gold band.
 *  Fixed colours so it reads the same on the light desk and the dusk rooms. */
function KaraniFace() {
  return (
    <svg viewBox="0 0 48 48" width="54" height="54" aria-hidden="true" className="shrink-0 mt-0.5">
      <circle cx="24" cy="28" r="14" fill="#F6F1E7" stroke="#1B1A17" strokeWidth="1.5" />
      <path d="M11 20 Q24 5 37 20 Z" fill="#C4572D" stroke="#1B1A17" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="9.5" y="18.5" width="29" height="4" fill="#D9A441" stroke="#1B1A17" strokeWidth="1.5" />
      <circle cx="18" cy="29" r="3.8" fill="none" stroke="#1B1A17" strokeWidth="1.5" />
      <circle cx="30" cy="29" r="3.8" fill="none" stroke="#1B1A17" strokeWidth="1.5" />
      <line x1="21.8" y1="29" x2="26.2" y2="29" stroke="#1B1A17" strokeWidth="1.5" />
      <circle cx="18" cy="29" r="1.2" fill="#1B1A17" />
      <circle cx="30" cy="29" r="1.2" fill="#1B1A17" />
      <path d="M19.5 36 Q24 39.5 28.5 36" fill="none" stroke="#1B1A17" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
