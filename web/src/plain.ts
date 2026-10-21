import type { ChecklistItem, Flag, LicenceVerdict } from "./api";
import { tOpt, type Lang } from "./i18n";

/** Why this file exists: the API sends compact technical text (rule ids, "ask / floor" policy lines, "Unresolved
 *  red flag in a signed contract"). That text is the record of what the engine decided, so we do NOT change it.
 *  Here the front end adds a plain-language version keyed by rule id, topic or key. Every function returns
 *  `undefined` (or the original) when it has no mapping, so a new rule on the API still shows its own text.
 *  The original technical text is shown in a "Show the exact rule" fold next to the plain one.
 *
 *  Every entry is a {en, sw} pair, so a missing Swahili line is a build error. The Swahili is AI-drafted and
 *  needs a fluent reviewer (see docs/DECISIONS.md). Reading level aimed for: about grade 6. */

export type Pair = { en: string; sw: string };
const pick = (lang: Lang, p: Pair) => p[lang];
const fill = (s: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((out, [k, v]) => out.replaceAll(`{${k}}`, String(v)), s);

/* ---------------------------------------------------------------- places and uses */

const PLACES: Record<string, Pair> = {
  KE: { en: "Kenya", sw: "Kenya" }, TZ: { en: "Tanzania", sw: "Tanzania" }, UG: { en: "Uganda", sw: "Uganda" },
  EA: { en: "East Africa", sw: "Afrika Mashariki" }, NG: { en: "Nigeria", sw: "Nigeria" },
  AF: { en: "Africa", sw: "Afrika" }, WW: { en: "the whole world", sw: "dunia nzima" },
  US: { en: "the United States", sw: "Marekani" }, NA: { en: "North America", sw: "Amerika Kaskazini" },
  GB: { en: "the United Kingdom", sw: "Uingereza" }, EU: { en: "Europe", sw: "Ulaya" },
};
export function placeName(lang: Lang, code: string): string {
  const p = PLACES[code];
  return p ? pick(lang, p) : code;
}

const USES: Record<string, Pair> = {
  ad: { en: "an advert", sw: "tangazo" },
  "sync-ad": { en: "an advert", sw: "tangazo" },
  "sync-film": { en: "a film", sw: "filamu" },
  "ai-training": { en: "AI training", sw: "mafunzo ya AI" },
  live: { en: "live shows", sw: "maonyesho ya moja kwa moja" },
  sample: { en: "a sample in another song", sw: "sampuli kwenye wimbo mwingine" },
};
export function useName(lang: Lang, use: string): string {
  const u = USES[use];
  return u ? pick(lang, u) : use.replace(/-/g, " ");
}

/** What the engine calls a kind of ownership, in words a writer would use. */
const RIGHTS: Record<string, Pair> = {
  master: { en: "recording", sw: "rekodi" },
  "master recording": { en: "recording", sw: "rekodi" },
  composition: { en: "song (words and tune)", sw: "wimbo (maneno na mdundo)" },
  artwork: { en: "artwork", sw: "kazi ya sanaa" },
};
export function rightName(lang: Lang, right: string): string {
  const r = RIGHTS[right];
  return r ? pick(lang, r) : right;
}

/* ---------------------------------------------------------------- flag cards (Desk / clause map) */

type FlagText = { title: Pair; meaning: Pair; cost: Pair; missing?: Pair };

const FLAGS: Record<string, FlagText> = {
  "R-GRANT-01": {
    title: { en: "The label would own your recordings for good", sw: "Lebo ingemiliki rekodi zako milele" },
    meaning: {
      en: "Clause {n} gives away your {right} rights forever, in every country, to the label only.",
      sw: "Kifungu {n} kinatoa haki zako za {right} milele, katika kila nchi, kwa lebo peke yake.",
    },
    cost: {
      en: "You could never use these recordings anywhere else or get them back, even if the label does nothing with them.",
      sw: "Hutaweza kamwe kuzitumia mahali pengine wala kuzirudisha, hata kama lebo haizitumii.",
    },
  },
  "R-GRANT-02": {
    title: { en: "The label keeps this for good", sw: "Lebo inabaki nayo milele" },
    meaning: {
      en: "Clause {n} gives away your {right} rights forever, but not to the label only.",
      sw: "Kifungu {n} kinatoa haki zako za {right} milele, ingawa si kwa lebo peke yake.",
    },
    cost: {
      en: "You can still let other people use it. But the label's right never ends.",
      sw: "Bado unaweza kuwaruhusu wengine waitumie. Lakini haki ya lebo haiishi kamwe.",
    },
  },
  "R-TERM-01": {
    title: { en: "The deal lasts longer than you want", sw: "Mkataba unadumu kuliko unavyotaka" },
    meaning: {
      en: "Clause {n} ties up your rights {value}. That is longer than the limit you set.",
      sw: "Kifungu {n} kinafunga haki zako {value}. Hii ni zaidi ya kikomo ulichoweka.",
    },
    cost: {
      en: "Your music stays locked up long after you want to move on.",
      sw: "Muziki wako unabaki umefungwa muda mrefu baada ya wewe kutaka kuendelea.",
    },
  },
  "R-AI-01": {
    title: { en: "The label can train AI on your music", sw: "Lebo inaweza kufundisha AI kwa muziki wako" },
    meaning: {
      en: "Clause {n} lets the label use your recordings and your voice to teach AI. It does not have to ask you or pay you.",
      sw: "Kifungu {n} kinairuhusu lebo kutumia rekodi na sauti yako kufundisha AI. Haihitaji kukuuliza wala kukulipa.",
    },
    cost: {
      en: "A computer could learn to sound like you. You would earn nothing from it.",
      sw: "Kompyuta inaweza kujifunza kusikika kama wewe. Hutapata chochote kutokana na hilo.",
    },
  },
  "R-AI-02": {
    title: { en: "Unclear words could allow AI training", sw: "Maneno yasiyo wazi yanaweza kuruhusu mafunzo ya AI" },
    meaning: {
      en: "Clause {n} talks about \"new technology\" but does not say what that means. It lets machines learn from your music in very open words.",
      sw: "Kifungu {n} kinataja \"teknolojia mpya\" bila kusema ni nini. Kinaruhusu mashine kujifunza kutoka muziki wako kwa maneno yaliyo wazi mno.",
    },
    cost: {
      en: "Unclear words are usually read in the label's favour. They could cover AI training.",
      sw: "Maneno yasiyo wazi mara nyingi hufasiriwa kwa faida ya lebo. Yanaweza kujumuisha mafunzo ya AI.",
    },
  },
  "R-VOICE-01": {
    title: { en: "The label can copy your voice", sw: "Lebo inaweza kunakili sauti yako" },
    meaning: {
      en: "Clause {n} lets the label make computer copies of your voice and use them.",
      sw: "Kifungu {n} kinairuhusu lebo kutengeneza nakala za kompyuta za sauti yako na kuzitumia.",
    },
    cost: {
      en: "Songs you never sang could come out in your voice.",
      sw: "Nyimbo ambazo hukuwahi kuimba zinaweza kutoka kwa sauti yako.",
    },
  },
  "R-REVERT-01": {
    title: { en: "Your rights never come back to you", sw: "Haki zako hazikurudii kamwe" },
    meaning: {
      en: "Clause {n} says your rights never come back to you, even if the label never releases your songs. (Rights coming back to you is called reversion.)",
      sw: "Kifungu {n} kinasema haki zako hazikurudii kamwe, hata kama lebo haitoi nyimbo zako. (Haki kukurudia huitwa \"reversion\".)",
    },
    cost: {
      en: "Songs that are never released can sit on a shelf forever.",
      sw: "Nyimbo ambazo hazitolewi zinaweza kukaa rafuni milele.",
    },
  },
  "R-XCOLL-01": {
    title: { en: "Debts from other deals come out of this deal's money", sw: "Madeni ya mikataba mingine yanatoka kwenye pesa za mkataba huu" },
    meaning: {
      en: "Clause {n} lets the label take back costs from your other deals out of the money from this one. (This is called cross-collateralising.)",
      sw: "Kifungu {n} kinairuhusu lebo kurudisha gharama za mikataba yako mingine kutoka kwenye pesa za mkataba huu. (Hii huitwa \"cross-collateralising\".)",
    },
    cost: {
      en: "One album that does not sell can stop you earning from one that does.",
      sw: "Albamu moja isiyouza inaweza kukuzuia kupata pesa kutoka kwa ile inayouza.",
    },
  },
  "R-OPT-01": {
    title: { en: "Only the label can add more time", sw: "Lebo pekee ndiyo inaweza kuongeza muda" },
    meaning: {
      en: "Clause {n} lets the label add more time to the deal, up to {value} times. You get no say.",
      sw: "Kifungu {n} kinairuhusu lebo kuongeza muda wa mkataba hadi mara {value}. Wewe huna neno.",
    },
    cost: {
      en: "The label can keep you on the same terms for years if it wants to.",
      sw: "Lebo inaweza kukuweka kwenye masharti yale yale kwa miaka mingi ikitaka.",
    },
  },
  "R-ROY-01": {
    title: { en: "Your share of the money is low", sw: "Sehemu yako ya pesa ni ndogo" },
    meaning: {
      en: "Clause {n} pays you {value}%. The example deal in Kabla pays at least {floor}%.",
      sw: "Kifungu {n} kinakulipa {value}%. Mkataba wa mfano ndani ya Kabla unalipa angalau {floor}%.",
    },
    cost: {
      en: "You keep less from every play. (This is an example comparison, not real market data.)",
      sw: "Unabaki na kidogo kutoka kila mara wimbo unapochezwa. (Huu ni mfano wa kulinganisha, si takwimu halisi za soko.)",
    },
  },
  "R-AUDIT-01": {
    title: { en: "You cannot check the label's books", sw: "Huwezi kukagua vitabu vya lebo" },
    meaning: {
      en: "Clause {n} does not let you look at the label's accounts.",
      sw: "Kifungu {n} hakikuruhusu kuangalia hesabu za lebo.",
    },
    missing: {
      en: "The contract does not let you look at the label's accounts.",
      sw: "Mkataba haukuruhusu kuangalia hesabu za lebo.",
    },
    cost: {
      en: "You cannot tell if your payment statements are right.",
      sw: "Huwezi kujua kama taarifa zako za malipo ni sahihi.",
    },
  },
  "R-SYNC-01": {
    title: { en: "The label can put your song in films and adverts", sw: "Lebo inaweza kuweka wimbo wako kwenye filamu na matangazo" },
    meaning: {
      en: "Clause {n} lets the label license your music for films, adverts and games without asking you. (Music in films and adverts is called sync.)",
      sw: "Kifungu {n} kinairuhusu lebo kutoa leseni ya muziki wako kwa filamu, matangazo na michezo bila kukuuliza. (Muziki kwenye filamu na matangazo huitwa \"sync\".)",
    },
    cost: {
      en: "Your song could end up in an advert you do not like.",
      sw: "Wimbo wako unaweza kuishia kwenye tangazo usilolipenda.",
    },
  },
  "R-SPLIT-01": {
    title: { en: "Who owns what is not settled", sw: "Nani anamiliki nini haijakubaliwa" },
    meaning: {
      en: "Clause {n} does not say each writer's share, or the shares do not add up to 100%.",
      sw: "Kifungu {n} hakitaji hisa ya kila mwandishi, au hisa hazifiki 100%.",
    },
    cost: {
      en: "Unclear shares cause arguments and stuck payments later.",
      sw: "Hisa zisizo wazi husababisha ugomvi na malipo kukwama baadaye.",
    },
  },
};

export type PlainFlag = { title: string; meaning: string; cost: string; plain: boolean };

/** Plain title / meaning / cost for one flag. `plain: false` means the original API text is shown unchanged. */
export function plainFlag(lang: Lang, flag: Flag): PlainFlag {
  const original: PlainFlag = {
    title: lang === "sw" ? flag.title_sw : flag.title_en,
    meaning: lang === "sw" ? flag.meaning_sw : flag.meaning_en,
    cost: lang === "sw" ? flag.cost_sw : flag.cost_en,
    plain: false,
  };
  const entry = FLAGS[flag.rule_id];
  if (!entry) return original;
  // Numbers and words are read off the English original (same digits in both languages), never invented.
  const en = flag.meaning_en;
  const vars: Record<string, string | number> = { n: flag.clause };
  if (flag.rule_id === "R-GRANT-01" || flag.rule_id === "R-GRANT-02") {
    const m = en.match(/the (master recording|composition|artwork) rights/);
    if (!m) return original;
    vars.right = rightName(lang, m[1]);
  } else if (flag.rule_id === "R-TERM-01") {
    const m = en.match(/up (for ever|for (\d+) years)/);
    if (!m) return original;
    vars.value = m[2] ? (lang === "sw" ? `kwa miaka ${m[2]}` : `for ${m[2]} years`) : lang === "sw" ? "milele" : "for ever";
  } else if (flag.rule_id === "R-OPT-01") {
    const m = en.match(/label (\d+) options/);
    if (!m) return original;
    vars.value = m[1];
  } else if (flag.rule_id === "R-ROY-01") {
    const m = en.match(/pays ([\d.]+)%, below the ([\d.]+)%/);
    if (!m) return original;
    vars.value = m[1];
    vars.floor = m[2];
  }
  const meaningPair = flag.clause === 0 && entry.missing ? entry.missing : entry.meaning;
  return {
    title: pick(lang, entry.title),
    meaning: fill(pick(lang, meaningPair), vars),
    cost: fill(pick(lang, entry.cost), vars),
    plain: true,
  };
}

/** Just the plain title, for lists that only carry a rule id and the API's own title. */
export function plainFlagTitle(lang: Lang, ruleId: string, original: string): string {
  const entry = FLAGS[ruleId];
  return entry ? pick(lang, entry.title) : original;
}

/** The "You told Kabla on <date>: ..." line, as a plain sentence. Undefined when it is not one we know. */
export function plainRedline(lang: Lang, flag: Flag): string | undefined {
  const date = flag.redline_set_on;
  const line = flag.trail.find((l) => l.text_en.startsWith("You told Kabla"));
  if (!date || !line) return undefined;
  const years = line.text_en.match(/no more than (\d+) years/);
  const ai = line.text_en.includes("never AI training");
  if (!years && !ai) return undefined;
  const limit: Pair = ai
    ? { en: "no AI training, ever", sw: "hakuna mafunzo ya AI, kamwe" }
    : { en: `no more than ${years![1]} years`, sw: `si zaidi ya miaka ${years![1]}` };
  const sentence: Pair = {
    en: "On {date} you told Kabla your limit: {limit}. This clause goes past it.",
    sw: "Tarehe {date} uliiambia Kabla kikomo chako: {limit}. Kifungu hiki kinakivuka.",
  };
  return fill(pick(lang, sentence), { date, limit: pick(lang, limit) });
}

/* ---------------------------------------------------------------- the label's written rule (Theater "why") */

/** Keyed by the engine's exact policy line. Words: "ask" = what the label first wants; "floor" = the least it will accept
 *  (for the royalty, the most it will pay). */
const POLICY: Record<string, Pair> = {
  "Mawingu policy 2.1 - AI training: ask granted, floor opt-in per use, paid": {
    en: "The label first asks to use your music to train AI. The least it will accept is this: only when you say yes each time, and it pays you.",
    sw: "Lebo kwanza inaomba kutumia muziki wako kufundisha AI. Kidogo kabisa itakachokubali ni hiki: tu ukisema ndiyo kila mara, na ikikulipa.",
  },
  "Mawingu policy 2.2 - voice: ask synthetic voice, floor name and photos for promotion only": {
    en: "The label first asks to make a computer copy of your voice. The least it will accept is this: your name and photos, only to promote the music.",
    sw: "Lebo kwanza inaomba kutengeneza nakala ya kompyuta ya sauti yako. Kidogo kabisa itakachokubali ni hiki: jina na picha zako, kwa kutangaza muziki tu.",
  },
  "Mawingu policy 1.1 - grant: ask perpetual worldwide, floor exclusive in Africa for the term": {
    en: "The label first asks to keep your recordings forever, in every country. The least it will accept is this: only in Africa, and only for the length of the deal.",
    sw: "Lebo kwanza inaomba kubaki na rekodi zako milele, katika kila nchi. Kidogo kabisa itakachokubali ni hiki: Afrika tu, na kwa muda wa mkataba tu.",
  },
  "Mawingu policy 1.2 - term: ask perpetual, floor 7 years": {
    en: "The label first asks for the deal to last forever. The least it will accept is 7 years.",
    sw: "Lebo kwanza inaomba mkataba udumu milele. Kidogo kabisa itakachokubali ni miaka 7.",
  },
  "Mawingu policy 1.3 - reversion: ask none, floor after 7 years if unrecouped": {
    en: "The label first asks that your rights never come back to you. The least it will accept is this: you get them back after 7 years if the advance has still not been paid back from your earnings.",
    sw: "Lebo kwanza inaomba haki zako zisikurudie kamwe. Kidogo kabisa itakachokubali ni hiki: unazirudishiwa baada ya miaka 7 ikiwa malipo ya awali bado hayajarudishwa kutoka mapato yako.",
  },
  "Mawingu policy 3.1 - royalty: ask 12%, floor 18%": {
    en: "The label first offers you 12% of the money. It will go up to 18% at most.",
    sw: "Lebo kwanza inakupa 12% ya pesa. Itapanda hadi 18% tu, si zaidi.",
  },
  "Mawingu policy 3.2 - cross-collateral: ask yes, floor this agreement only": {
    en: "The label first asks to pay off debts from your other deals out of this deal's money. The least it will accept is this deal only.",
    sw: "Lebo kwanza inaomba kulipa madeni ya mikataba yako mingine kutoka pesa za mkataba huu. Kidogo kabisa itakachokubali ni mkataba huu pekee.",
  },
  "Mawingu policy 1.4 - options: ask three label options, floor two label options": {
    en: "The label first asks for 3 chances to add time to the deal. The least it will accept is 2.",
    sw: "Lebo kwanza inaomba nafasi 3 za kuongeza muda wa mkataba. Kidogo kabisa itakachokubali ni 2.",
  },
  "Pwani policy A - term: ask 10 years, floor 7 years": {
    en: "The label first asks for a 10-year deal. The least it will accept is 7 years.",
    sw: "Lebo kwanza inaomba mkataba wa miaka 10. Kidogo kabisa itakachokubali ni miaka 7.",
  },
  "Pwani policy B - new uses: ask open wording, floor opt-in per use, paid": {
    en: "The label first asks for open words that allow new uses of your music, such as AI. The least it will accept is this: only when you say yes each time, and it pays you.",
    sw: "Lebo kwanza inaomba maneno yaliyo wazi yanayoruhusu matumizi mapya ya muziki wako, kama AI. Kidogo kabisa itakachokubali ni hiki: tu ukisema ndiyo kila mara, na ikikulipa.",
  },
  "Pwani policy C - cross-collateral is not negotiable": {
    en: "The label will not change this one. It wants to pay off debts from your other deals out of this deal's money.",
    sw: "Lebo haitabadilisha hili. Inataka kulipa madeni ya mikataba yako mingine kutoka pesa za mkataba huu.",
  },
  "Pwani policy D - audit: ask none, floor one audit a year": {
    en: "The label first says you cannot check its books. The least it will accept is one check a year.",
    sw: "Lebo kwanza inasema huwezi kukagua vitabu vyake. Kidogo kabisa itakachokubali ni ukaguzi mmoja kwa mwaka.",
  },
  "Kilele policy 1 - splits: we pay whatever split sheet the writers sign": {
    en: "The label pays whatever shares the writers sign on their split sheet.",
    sw: "Lebo inalipa hisa zozote ambazo waandishi wamesaini kwenye karatasi yao ya mgawanyo.",
  },
};

/** Plain sentence for the engine's policy line, or undefined when we do not know that line. */
export function plainPolicy(lang: Lang, line: string): string | undefined {
  const p = POLICY[line.trim()];
  return p ? pick(lang, p) : undefined;
}

/* ---------------------------------------------------------------- checklist */

const CHECKLIST: Record<string, { label: Pair; warning: Pair }> = {
  "red-lines": {
    label: { en: "You have set your limits", sw: "Umeweka mipaka yako" },
    warning: {
      en: "Before you sign, set a limit you will not go past, such as no AI training or a longest deal length.",
      sw: "Kabla hujasaini, weka kikomo usichokivuka, kama kutokuruhusu mafunzo ya AI au urefu wa juu wa mkataba.",
    },
  },
  "ai-stance": {
    label: { en: "You have chosen your rule on AI training", sw: "Umechagua kanuni yako kuhusu mafunzo ya AI" },
    warning: {
      en: "Choose one: never allow it, allow it only with your OK, or allow it.",
      sw: "Chagua moja: usiruhusu kamwe, ruhusu kwa idhini yako tu, au ruhusu.",
    },
  },
  splits: {
    label: { en: "The writers' shares add up to 100%", sw: "Hisa za waandishi zinafika 100%" },
    warning: {
      en: "The shares of everyone who wrote the song must add up to 100%.",
      sw: "Hisa za wote walioandika wimbo lazima zifike 100%.",
    },
  },
  consents: {
    label: { en: "Every co-writer has agreed", sw: "Kila mwandishi-mwenza amekubali" },
    warning: {
      en: "A co-writer has not yet agreed to their share.",
      sw: "Mwandishi-mwenza bado hajakubali hisa yake.",
    },
  },
};

export function plainChecklist(lang: Lang, item: ChecklistItem): { label: string; warning: string } {
  const e = CHECKLIST[item.key];
  if (e) return { label: pick(lang, e.label), warning: pick(lang, e.warning) };
  return lang === "sw"
    ? { label: item.label_sw, warning: item.warning_sw }
    : { label: item.label_en, warning: item.warning_en };
}

/* ---------------------------------------------------------------- score steps, badges, backer lines */

const STEPS: Record<string, Pair> = {
  "Work registered with hash and artist consent": { en: "Register your work, with your OK.", sw: "Sajili kazi yako, kwa idhini yako." },
  "All contributors listed": { en: "List everyone who helped on the work.", sw: "Orodhesha kila aliyesaidia kwenye kazi." },
  "AI tools used on the work are disclosed": { en: "Say which AI tools, if any, were used on the work.", sw: "Sema zana za AI zilizotumika kwenye kazi, kama zipo." },
  "AI-training stance explicitly set": { en: "Choose your rule on AI training.", sw: "Chagua kanuni yako kuhusu mafunzo ya AI." },
  "Splits agreed by every co-writer and total 100%": { en: "Get every co-writer to agree the shares, adding up to 100%.", sw: "Pata kila mwandishi-mwenza akubali hisa, zikifika 100%." },
  "Contract analysed and no unresolved red flags": { en: "Fix every red warning in the contract.", sw: "Rekebisha kila onyo jekundu kwenye mkataba." },
  "A licence was granted with all required consents": { en: "Give a licence only when everyone who owns a share has said yes.", sw: "Toa leseni tu wakati kila mwenye hisa amesema ndiyo." },
};
export function plainStep(lang: Lang, original: string): string {
  const s = STEPS[original];
  return s ? pick(lang, s) : original;
}

/** A score line in plain words, by the kind of event. These sentences live in i18n.ts (keys rg.* and rt.*) because
 *  the Sign check page already used them; the API's own `why` text is the fallback. */
export function reasonWords(lang: Lang, r: { type?: string; why: string }): string {
  return (r.type && (tOpt(lang, `rg.${r.type}`) ?? tOpt(lang, `rt.${r.type}`))) || r.why;
}

const BADGES: Record<string, { name: Pair; desc: Pair }> = {
  "Read Before Signing": {
    name: { en: "You read it first", sw: "Ulisoma kwanza" },
    desc: { en: "Kabla read the contract and showed you its warnings.", sw: "Kabla ilisoma mkataba na kukuonyesha maonyo yake." },
  },
  "AI-Training Locked": {
    name: { en: "AI rule chosen", sw: "Kanuni ya AI imechaguliwa" },
    desc: { en: "You chose a rule on AI training.", sw: "Ulichagua kanuni kuhusu mafunzo ya AI." },
  },
  "Splits Agreed": {
    name: { en: "Shares agreed", sw: "Hisa zimekubaliwa" },
    desc: { en: "Every co-writer agreed, and the shares add up to 100%.", sw: "Kila mwandishi-mwenza amekubali, na hisa zinafika 100%." },
  },
  "Clean Deal": {
    name: { en: "No red warnings left", sw: "Hakuna onyo jekundu lililobaki" },
    desc: { en: "No red warnings are left open after the check.", sw: "Hakuna onyo jekundu lililobaki wazi baada ya ukaguzi." },
  },
  "Fully Cleared": {
    name: { en: "Every permission in place", sw: "Kila idhini ipo" },
    desc: { en: "A licence was given with everyone's permission.", sw: "Leseni ilitolewa kwa idhini ya kila mtu." },
  },
};
export function plainBadge(lang: Lang, name: string): { name: string; desc?: string } {
  const b = BADGES[name];
  return b ? { name: pick(lang, b.name), desc: pick(lang, b.desc) } : { name };
}

const BACKER: Record<string, Pair> = {
  "R-GRANT-01": { en: "The artist gave this work away for good, to one company. They cannot take it anywhere else.", sw: "Msanii alitoa kazi hii milele, kwa kampuni moja. Hawezi kuipeleka kwingine." },
  "R-GRANT-02": { en: "The work is tied up with no end date.", sw: "Kazi imefungwa bila tarehe ya mwisho." },
  "R-TERM-01": { en: "The deal runs longer than the artist's own limit.", sw: "Mkataba unadumu kuliko kikomo cha msanii mwenyewe." },
  "R-AI-01": { en: "The label may train AI on the recordings and pay nothing extra.", sw: "Lebo inaweza kufundisha AI kwa rekodi bila kulipa chochote cha ziada." },
  "R-AI-02": { en: "Unclear words could let AI use in later, without a clear yes.", sw: "Maneno yasiyo wazi yanaweza kuruhusu matumizi ya AI baadaye, bila ndiyo iliyo wazi." },
  "R-VOICE-01": { en: "A computer copy of the artist's voice could be made.", sw: "Nakala ya kompyuta ya sauti ya msanii inaweza kutengenezwa." },
  "R-REVERT-01": { en: "Rights that are not used may never go back to the artist.", sw: "Haki zisizotumika huenda zisimrudie msanii kamwe." },
  "R-XCOLL-01": { en: "Money earned on one deal may pay off the debts of another.", sw: "Pesa zinazopatikana kwenye mkataba mmoja zinaweza kulipa madeni ya mwingine." },
  "R-OPT-01": { en: "The artist cannot say no when the label adds more time.", sw: "Msanii hawezi kukataa lebo ikiongeza muda." },
  "R-ROY-01": { en: "The artist's share is small. (Compared with an example, not real market data.)", sw: "Sehemu ya msanii ni ndogo. (Ikilinganishwa na mfano, si takwimu halisi za soko.)" },
  "R-AUDIT-01": { en: "The artist cannot check the label's numbers.", sw: "Msanii hawezi kukagua hesabu za lebo." },
  "R-SYNC-01": { en: "The work could go into films or adverts without the artist seeing it first.", sw: "Kazi inaweza kuingia kwenye filamu au matangazo bila msanii kuiona kwanza." },
  "R-SPLIT-01": { en: "Shares are missing or do not add up to 100%, so a later licence could get stuck.", sw: "Hisa hazipo au hazifiki 100%, kwa hiyo leseni ya baadaye inaweza kukwama." },
};
export function plainBackerRisk(lang: Lang, ruleId: string, original: string): string {
  const b = BACKER[ruleId];
  return b ? pick(lang, b) : original;
}

export function plainConsentGap(lang: Lang, original: string): string {
  if (original === "Has not confirmed their share.") {
    return lang === "sw" ? "Bado hajakubali hisa yake." : "Has not yet agreed to their share.";
  }
  const m = original.match(/^Needs consent for (.+) in (.+)\.$/);
  if (m) {
    const use = useName(lang, m[1]);
    const where = placeName(lang, m[2]);
    return lang === "sw"
      ? `Anahitaji kusema ndiyo kwa matumizi ya ${use} katika ${where}.`
      : `Needs to say yes to use for ${use} in ${where}.`;
  }
  return original;
}

/* ---------------------------------------------------------------- licence desk */

/** The request id the API makes is r-<use>-<territory>-<months>, so the question can be read back from it. */
export function parseRequestId(id: string | undefined): { use: string; territory: string; months: number } | null {
  const m = id?.match(/^r-(.+)-([A-Z]{2})-(\d+)$/);
  return m ? { use: m[1], territory: m[2], months: Number(m[3]) } : null;
}

export function plainLicenceHeadline(lang: Lang, v: LicenceVerdict): string | undefined {
  const req = parseRequestId(v.request_id);
  const nums = (v.headline_en.match(/\d+/g) ?? []).map(Number);
  const where = req ? placeName(lang, req.territory) : "";
  const use = req ? useName(lang, req.use) : "";
  switch (v.rule_id) {
    case "R-LIC-AI":
      return lang === "sw"
        ? "Hairuhusiwi. Uliiambia Kabla hutaki muziki wako utumike kufundisha AI, kwa hiyo matumizi haya hayaruhusiwi."
        : "Not allowed. You told Kabla you never want your music used to train AI, so this use is not allowed.";
    case "R-LIC-AI-OPTIN":
      return lang === "sw"
        ? "Uliza kwanza. Mafunzo ya AI yanahitaji ndiyo kutoka kwa kila mmiliki, kila mara."
        : "Ask first. AI training needs a yes from every owner, each time.";
    case "R-LIC-TERM": {
      if (nums.length < 2) return undefined;
      const [months, max] = nums;
      return lang === "sw"
        ? `Hairuhusiwi. Miezi ${months} ni zaidi ya leseni ndefu zaidi inayoruhusiwa hapa (miezi ${max}).`
        : `Not allowed. ${months} months is longer than the longest licence allowed here (${max} months).`;
    }
    case "R-LIC-CONSENT": {
      if (!req || v.missing.length === 0) return undefined;
      const who = v.missing.map((m) => m.name).join(", ");
      return lang === "sw"
        ? `Uliza kwanza. ${who} bado hajasema ndiyo kwa matumizi ya ${use} katika ${where}.`
        : `Ask first. ${who} has not said yes to use for ${use} in ${where}.`;
    }
    case "R-LIC-OK":
      if (!req) return undefined;
      return lang === "sw"
        ? `Ndiyo. Kila mwenye hisa amesema ndiyo kwa ${where}. Masharti haya yanaambatana nayo.`
        : `Yes. Everyone who owns a share has said yes for ${where}. These conditions come with it.`;
    default:
      return undefined;
  }
}

const CONDITIONS: Record<string, Pair> = {
  "no-ai-training": { en: "They may not use the track to train AI.", sw: "Hawaruhusiwi kutumia wimbo kufundisha AI." },
  "no-synthetic-voice": {
    en: "They may not make a computer copy of your voice. They may use your name and approved photos only to promote the music.",
    sw: "Hawaruhusiwi kutengeneza nakala ya kompyuta ya sauti yako. Wanaweza kutumia jina na picha zilizoidhinishwa kutangaza muziki tu.",
  },
};
export function plainCondition(lang: Lang, key: string, original: string): string {
  if (key === "term-window") {
    const n = original.match(/\d+/g);
    if (n && n.length >= 2) {
      return lang === "sw"
        ? `Leseni inadumu miezi ${n[0]}. Muda mrefu zaidi unaoruhusiwa ni miezi ${n[1]}.`
        : `The licence lasts ${n[0]} months. The longest allowed is ${n[1]} months.`;
    }
    return original;
  }
  const c = CONDITIONS[key];
  return c ? pick(lang, c) : original;
}

/* ---------------------------------------------------------------- verify */

/** The engine's reason for an intact or broken certificate, in a sentence a musician can follow. */
export function plainVerifyReason(lang: Lang, intact: boolean, reason: string | undefined): string | undefined {
  if (intact) {
    return lang === "sw"
      ? "Alama ya vidole na saini vinalingana. Hakuna aliyebadilisha cheti hiki."
      : "The fingerprint and the signature match. Nobody has changed this certificate.";
  }
  const r = reason ?? "";
  if (/signature mismatch/.test(r)) {
    return lang === "sw"
      ? "Saini haiendani. Cheti hiki kimebadilishwa, au hakikutolewa na Kabla."
      : "The signature does not match. This certificate was changed, or Kabla did not issue it.";
  }
  if (/hash mismatch/.test(r)) {
    return lang === "sw"
      ? "Alama ya vidole ya rekodi haiendani tena, kwa hiyo kitu kimebadilishwa."
      : "A record's fingerprint no longer matches, so something was changed.";
  }
  if (/work file hash/.test(r)) {
    return lang === "sw"
      ? "Faili ya kazi si ile iliyotumika kutoa cheti hiki."
      : "The work file is not the one this certificate was issued for.";
  }
  return undefined;
}
