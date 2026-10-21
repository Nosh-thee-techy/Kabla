import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { t, type Lang } from "../i18n";

const STEPS = {
  en: {
    desk: [
      "Pick a sample contract. Mawingu has the most traps. Or paste your own text.",
      "Kabla reads the contract and marks the risky parts. Nothing is signed.",
      "Next you see the contract with its warnings. Use the numbered bar at the top to move between steps.",
    ],
    map: [
      "The fairness line counts the warnings. Each warning points to one clause in the contract.",
      "Red means a serious problem. Amber means check it. Tap a marked clause to read why, in plain words.",
      "The two numbers show how ready the contract is to sign: as written, and in the best case if you win every red point.",
    ],
    sim: [
      "Slide to choose how many times your song is played.",
      "Left: what you keep with the contract as written. Right: what you keep if you get fairer terms.",
      "These are example numbers, not a promise. To really change the terms, go to the Theater.",
    ],
    theater: [
      "Press 'Raise the curtain'. Two automatic helpers talk for you and for the label. You make every final decision.",
      "For each offer from the label, press Approve or Reject. Kabla never agrees for you.",
      "Your limit is the line you will not go past. If an offer is past your limit, Kabla tells you to say no.",
    ],
    check: [
      "Two big numbers: how ready the contract is to sign as written, and after your negotiation. Tap one to see why.",
      "'What is holding it back' lists only the things that cost you points, and how to fix each one.",
      "'Before you sign' only warns you. You decide whether to sign.",
    ],
    licence: [
      "Open one request: an advert in Kenya, AI training, or a film that needs Baraka's permission.",
      "Kabla says allowed, not allowed, or someone must say yes first. It tells you why.",
      "Try all three. Then register your work to get a passport.",
    ],
    passport: [
      "Before you register, the list warns you if something is missing, such as your limits, your AI rule, who owns what, or someone's yes.",
      "Pressing the register button means you agree to register this work. Selling is a separate tick.",
      "Then you get a record code, badges and a rights score. Show it to a backer so they can check it.",
    ],
    verify: [
      "Paste a certificate, or press 'Tamper test' after you get a passport.",
      "Intact (green light) means nobody changed it. Tampered (red light) means something was changed, and it says what.",
      "Change one letter yourself to watch it get caught.",
    ],
    onboard: [
      "Tick the consent box first. Kabla keeps only what you type, and marks it as your own word, not proof.",
      "Put song titles in quotes with your share beside each, like \"Mwanga\" is 50% mine. Or use the demo artist.",
      "Kabla never opens your accounts. It lists what is missing, then you go to the desk.",
    ],
    financier: [
      "This page rearranges your passport for a backer: who owns what, open warnings, your AI rule and your score.",
      "It is not a credit score and not lending advice. Demo data only.",
      "Nothing new is decided here. Every warning is the same one you saw on the clause map.",
    ],
  },
  sw: {
    desk: [
      "Chagua mkataba wa mfano. Mawingu ina mitego mingi zaidi. Au bandika maandishi yako.",
      "Kabla inasoma mkataba na kuweka alama sehemu hatari. Hakuna kinachosainiwa.",
      "Kisha unaona mkataba na maonyo yake. Tumia upau wenye namba juu kuhama kati ya hatua.",
    ],
    map: [
      "Mstari wa haki unahesabu maonyo. Kila onyo linaelekeza kwenye kifungu kimoja cha mkataba.",
      "Nyekundu inamaanisha tatizo zito. Njano inamaanisha angalia. Gusa kifungu chenye alama kusoma kwa nini, kwa maneno rahisi.",
      "Namba mbili zinaonyesha mkataba ulivyo tayari kusainiwa: kama ulivyoandikwa, na hali bora ukishinda kila hoja nyekundu.",
    ],
    sim: [
      "Sogeza kuchagua mara ngapi wimbo wako unachezwa.",
      "Kushoto: unachobaki nacho mkataba ukiwa kama ulivyoandikwa. Kulia: unachobaki nacho ukipata masharti bora.",
      "Hizi ni namba za mfano, si ahadi. Kubadilisha masharti kweli, nenda Ukumbini.",
    ],
    theater: [
      "Bonyeza 'Inua pazia'. Wasaidizi wawili wa kiotomatiki wanaongea kwa niaba yako na ya lebo. Wewe ndiye unayeamua mwisho.",
      "Kwa kila ofa ya lebo, bonyeza Kubali au Kataa. Kabla haikubali kwa niaba yako.",
      "Kikomo chako ni mstari ambao hutaivuka. Ofa ikivuka kikomo chako, Kabla inakuambia useme hapana.",
    ],
    check: [
      "Namba mbili kubwa: mkataba ulivyo tayari kusainiwa kama ulivyoandikwa, na baada ya majadiliano yako. Gusa moja kuona kwa nini.",
      "'Kinachokuzuia' kinaorodhesha tu mambo yanayokupunguzia pointi, na jinsi ya kurekebisha kila moja.",
      "'Kabla hujasaini' inaonya tu. Wewe unaamua kusaini au la.",
    ],
    licence: [
      "Fungua ombi moja: tangazo la Kenya, mafunzo ya AI, au filamu inayohitaji ruhusa ya Baraka.",
      "Kabla inasema inaruhusiwa, hairuhusiwi, au mtu lazima aseme ndiyo kwanza. Inakueleza kwa nini.",
      "Jaribu yote matatu. Kisha sajili kazi yako upate pasipoti.",
    ],
    passport: [
      "Kabla ya kusajili, orodha inaonya kama kuna kinachokosekana, kama vikomo vyako, kanuni yako ya AI, nani anamiliki nini, au ndiyo ya mtu.",
      "Kubonyeza kitufe cha kusajili kunamaanisha unakubali kusajili kazi hii. Kuuza ni alama tofauti.",
      "Kisha unapata msimbo wa rekodi, beji na alama ya haki. Mwonyeshe mfadhili ili aukague.",
    ],
    verify: [
      "Bandika cheti, au bonyeza 'Jaribio la kubadilisha' baada ya kupata pasipoti.",
      "Sahihi (taa ya kijani) inamaanisha hakuna aliyebadilisha. Imebadilishwa (taa nyekundu) inamaanisha kuna kilichobadilishwa, na inasema nini.",
      "Badilisha herufi moja mwenyewe uone ikikamatwa.",
    ],
    onboard: [
      "Weka alama kwenye kisanduku cha idhini kwanza. Kabla inahifadhi unachoandika tu, na inakiweka alama kuwa neno lako, si ushahidi.",
      "Weka majina ya nyimbo ndani ya nukuu na hisa yako kando, kama \"Mwanga\" ni 50% yangu. Au tumia msanii wa mfano.",
      "Kabla haifungui akaunti zako. Inaorodhesha kinachokosekana, kisha unaenda mezani.",
    ],
    financier: [
      "Ukurasa huu unapanga pasipoti yako kwa mfadhili: nani anamiliki nini, maonyo yaliyo wazi, kanuni yako ya AI na alama yako.",
      "Si alama ya mkopo wala ushauri wa kukopesha. Data ya mfano tu.",
      "Hakuna uamuzi mpya hapa. Kila onyo ni lile lile uliloliona kwenye ramani ya vifungu.",
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
