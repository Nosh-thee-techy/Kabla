import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
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
    onboard: [
      "Tick consent first. Kabla records only what you type, marked self-declared.",
      "Put song titles in quotes with a split beside each. A demo artist is one click away.",
      "Kabla never opens your accounts. MeTTa lists what is missing, then you go to the desk.",
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
    onboard: [
      "Weka idhini kwanza. Kabla inarekodi unachoandika tu, kimewekwa alama ya kujitangaza.",
      "Weka majina ya nyimbo ndani ya nukuu na mgawanyo kando. Msanii wa mfano yuko mbofyo mmoja.",
      "Kabla haifungui akaunti zako. MeTTa inaorodhesha kinachokosekana, kisha unaenda mezani.",
    ],
    financier: [
      "Karatasi hii inapanga pasipoti: wamiliki, bendera, msimamo wa AI, alama.",
      "Si alama ya mkopo wala ushauri wa kukopesha. DATA BANDIA tu.",
      "Kila bendera bado ina sheria na kifungu. Hakuna uamuzi mpya hapa.",
    ],
  },
} as const;

export type Page = keyof typeof STEPS.en;

/** What the primary button on Karani's card does. `to` navigates; `onClick` acts in the room. */
export type ClerkCta = { label: string; to?: string; onClick?: () => void };

const SEEN_KEY = "karani-seen";
const VOICE_KEY = "karani-voice";

function seen(): Set<string> {
  try { return new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) || "[]")); } catch { return new Set(); }
}
function markSeen(cue: string) {
  const s = seen(); s.add(cue);
  sessionStorage.setItem(SEEN_KEY, JSON.stringify([...s]));
}

/** One shared check so eight rooms don't each ask the API whether voice is configured. */
let voiceEnabled: Promise<boolean> | null = null;
function elevenLabsReady(): Promise<boolean> {
  voiceEnabled ??= api.voiceStatus().then((s) => s.enabled).catch(() => false);
  return voiceEnabled;
}

/** Why this exists: a guide pinned to the page bottom fell below the fold. Karani now interrupts
 *  once per state (`cue`) as a bottom-right card that dims the room, says what to do, and offers one
 *  button that does it. After that he waits as a small badge in the corner. He can also read the
 *  line aloud: ElevenLabs through the API when a key is set, else the browser's own voice. */
export function Clerk({ lang, page, say, cue, cta }: { lang: Lang; page: Page; say: string; cue: string; cta?: ClerkCta }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState(false);
  const [voiceOn, setVoiceOn] = useState(() => localStorage.getItem(VOICE_KEY) === "on");
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lines = STEPS[lang][page];

  // Interrupt once per cue per session; later visits only show the corner badge.
  useEffect(() => {
    if (!seen().has(cue)) { setOpen(true); markSeen(cue); }
  }, [cue]);

  const hush = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(async () => {
    hush();
    setSpeaking(true);
    try {
      if (await elevenLabsReady()) {
        const blob = await api.voice(say, lang);
        const audio = new Audio(URL.createObjectURL(blob));
        audioRef.current = audio;
        audio.onended = () => setSpeaking(false);
        await audio.play();
        return;
      }
    } catch {
      /* fall through to the browser voice */
    }
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(say);
      u.lang = lang === "sw" ? "sw-KE" : "en-KE";
      u.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    } else {
      setSpeaking(false);
    }
  }, [say, lang, hush]);

  // Auto-read when the card opens and the lamp for voice is on. Browsers may refuse before the
  // first click on the page; that rejection is swallowed and the speaker button still works.
  useEffect(() => {
    if (open && voiceOn) void speak();
    if (!open) hush();
  }, [open, voiceOn, speak, hush]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function toggleVoice() {
    const next = !voiceOn;
    setVoiceOn(next);
    localStorage.setItem(VOICE_KEY, next ? "on" : "off");
    if (!next) hush();
  }

  function act() {
    setOpen(false);
    cta?.onClick?.();
    if (cta?.to) navigate(cta.to);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 pl-1 pr-3 py-1 bubble-card rounded-full shadow-stamp hover:-translate-y-0.5 transition"
        aria-label={t(lang, "askKarani")}
      >
        <KaraniFace size={36} />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em]">{t(lang, "askKarani")}</span>
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/45" onClick={() => setOpen(false)} aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="karani-title"
        className="fixed bottom-4 right-4 z-50 w-[min(26rem,calc(100vw-2rem))] bubble-card shadow-stamp"
      >
        <div className="flex items-start gap-3 p-4">
          <KaraniFace size={56} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p id="karani-title" className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta dark:text-gold">
                {t(lang, "karani")}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void speak()}
                  className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border hair rounded-sm ${speaking ? "bg-terracotta text-paper" : ""}`}
                  aria-label={t(lang, "hearKarani")}
                >
                  {speaking ? "…" : "▶"} {t(lang, "hearKarani")}
                </button>
                <button
                  type="button"
                  onClick={toggleVoice}
                  aria-pressed={voiceOn}
                  className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border hair rounded-sm ${voiceOn ? "bg-savanna text-paper" : "opacity-60"}`}
                >
                  {t(lang, voiceOn ? "voiceOn" : "voiceOff")}
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-[15px] leading-snug">{say}</p>
            <button
              type="button"
              className="mt-2 text-xs underline opacity-70 hover:opacity-100"
              aria-expanded={steps}
              onClick={() => setSteps(!steps)}
            >
              {steps ? t(lang, "hideSteps") : t(lang, "showSteps")}
            </button>
            {steps && (
              <ol className="mt-2 space-y-1 border-t hair pt-2">
                {lines.map((line, i) => (
                  <li key={i} className="text-xs leading-snug opacity-85">
                    <span className="font-mono text-terracotta dark:text-gold mr-1.5">{i + 1}.</span>
                    {line}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t hair">
          <button type="button" onClick={() => setOpen(false)} className="text-xs underline opacity-70 hover:opacity-100">
            {t(lang, "later")}
          </button>
          <button type="button" onClick={act} className="stamp stamp-terracotta" autoFocus>
            {cta?.label ?? t(lang, "ctaGotIt")} →
          </button>
        </div>
      </section>
    </>
  );
}

/** Karani's face: paper-coloured head, round spectacles, terracotta kofia with a gold band.
 *  Fixed colours so it reads the same on the light desk and the dusk rooms. */
function KaraniFace({ size = 54 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className="shrink-0">
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
