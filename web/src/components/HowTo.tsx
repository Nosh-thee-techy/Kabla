import { t, type Lang } from "../i18n";

const STEPS = {
  en: {
    desk: [
      "Pick a folder (Mawingu is the trap-heavy demo) or blot your own text.",
      "Kabla reads it into facts, then MeTTa flags traps. Nothing is signed yet.",
      "You land on the clause map. Use the rail at the top to move rooms.",
    ],
    map: [
      "Red and amber seals mark clauses. Click one to open its trail.",
      "The right panel shows the rule id, the clause, and what it costs you.",
      "When you have seen enough, stamp through to the simulator.",
    ],
    sim: [
      "Drag streams. The numbers are illustrative — not a forecast.",
      "Left is the deal as written. Right is after a fairer ask.",
      "Then sit in the theater to actually change the terms.",
    ],
    theater: [
      "Raise the curtain. Two rule agents talk; you are the only closer.",
      "Stamp Approve or Reject on every concession. Kabla never agrees for you.",
      "Reject at least one if you want to hold a red line. Then send the stamps.",
    ],
    licence: [
      "Open an envelope: a Kenyan ad, AI training, or a film that needs Baraka.",
      "MeTTa returns cleared, not cleared, or needs consent — with a rule id.",
      "Try all three. Then seal a passport for the agreed terms.",
    ],
    passport: [
      "Consent to register the work (sale is a separate tick, default off).",
      "Issue the booklet: hash, badges, and a rights-health score — not credit.",
      "Copy the hash if you want. Then take the certificate to customs.",
    ],
    verify: [
      "Paste certificate JSON, or run the tamper test after issuing a passport.",
      "Intact: green lamp, you may pass. Tampered: red lamp, it names the break.",
      "Change one character yourself if you want to see the clerk catch it.",
    ],
  },
  sw: {
    desk: [
      "Chagua folda (Mawingu ndiyo mfano wenye mitego) au bandika maandishi.",
      "Kabla inasoma ukweli, kisha MeTTa inaweka bendera. Bado hujasaini.",
      "Utaingia kwenye ramani. Tumia reli juu kuhama vyumba.",
    ],
    map: [
      "Muhuri mwekundu na wa njano unaashiria vifungu. Bofya kufungua njia.",
      "Paneli ya kulia inaonyesha kitambulisho cha sheria, kifungu, na gharama.",
      "Ukishaona, piga muhuri uende kwenye kisimulizi.",
    ],
    sim: [
      "Sogeza idadi ya mitiririko. Hizi ni namba za mfano — si utabiri.",
      "Kushoto ni mkataba kama ulivyo. Kulia ni baada ya ombi bora.",
      "Kisha keti ukumbini kubadilisha masharti.",
    ],
    theater: [
      "Inua pazia. Mawakala wawili wanazungumza; wewe ndiye unayefunga.",
      "Piga Kubali au Kataa kila hatua. Kabla haikubali kwa niaba yako.",
      "Kataa angalau moja ukitaka kushikilia mstari. Kisha tuma muhuri.",
    ],
    licence: [
      "Fungua bahasha: tangazo la Kenya, mafunzo ya AI, au filamu inayohitaji Baraka.",
      "MeTTa inarudisha imeruhusiwa, hairuhusiwi, au inahitaji idhini — na sheria.",
      "Jaribu zote tatu. Kisha funga pasipoti ya masharti yaliyokubaliwa.",
    ],
    passport: [
      "Kubali kusajili kazi (kuuza ni alama tofauti, kawaida imezimwa).",
      "Toa kitabu: hash, beji, na alama ya afya ya haki — si mkopo.",
      "Nakili hash ukitaka. Kisha peleka cheti forodhani.",
    ],
    verify: [
      "Bandika JSON ya cheti, au fanya jaribio la kuharibu baada ya kutoa pasipoti.",
      "Sahihi: taa kijani, unaweza kupita. Imeharibiwa: taa nyekundu, inataja kasoro.",
      "Badilisha herufi moja mwenyewe uone karani akishika.",
    ],
  },
} as const;

export function HowTo({ lang, page }: { lang: Lang; page: keyof typeof STEPS.en }) {
  const steps = STEPS[lang][page];
  return (
    <div className="mt-auto pt-10">
      <aside className="guide-card max-w-sm" aria-label={t(lang, "howTo")}>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta dark:text-gold">
          {t(lang, "howTo")}
        </p>
        <ol className="mt-2 space-y-1.5">
          {steps.map((line, i) => (
            <li key={i} className="text-xs leading-snug opacity-85">
              <span className="font-mono text-terracotta dark:text-gold mr-1.5">{i + 1}.</span>
              {line}
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
