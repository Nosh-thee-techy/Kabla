export type Lang = "en" | "sw";

const ui = {
  en: {
    tagline: "Know what you're signing. Prove what you own.",
    synthetic: "SYNTHETIC DATA — invented contracts, artists and amounts. Not legal advice.",
    desk: "Desk", map: "Clause map", sim: "Simulator", theater: "Theater",
    licence: "Licence desk", passport: "Passport", verify: "Verify",
    pick: "Pick a synthetic contract", paste: "Or paste text",
    analyse: "Read this contract", analysing: "Asking MeTTa…",
    red: "red", amber: "amber", trail: "Why this flag",
    cost: "What it costs you", illustrate: "Illustrative, synthetic rates — not market data.",
    asWritten: "As written", after: "After negotiation",
    approve: "Approve", reject: "Reject",
    cleared: "Cleared", notCleared: "Not cleared", needsConsent: "Needs consent",
    register: "Register this work (I consent)", sell: "Also list for sale",
    issue: "Issue passport", intact: "Intact", tampered: "Tampered",
    tamper: "Tamper test (change one character)",
    whyScore: "Why this number", health: "Rights-health, not credit",
    next: "Next best steps",
  },
  sw: {
    tagline: "Jua unachosaini. Thibitisha unachomiliki.",
    synthetic: "DATA BANDIA — mikataba, wasanii na kiasi vilivyozuliwa. Si ushauri wa kisheria.",
    desk: "Meza", map: "Ramani ya vifungu", sim: "Kisimulizi", theater: "Ukumbi",
    licence: "Dawati la leseni", passport: "Pasipoti", verify: "Thibitisha",
    pick: "Chagua mkataba wa mfano", paste: "Au bandika maandishi",
    analyse: "Soma mkataba huu", analysing: "Inauliza MeTTa…",
    red: "nyekundu", amber: "njano", trail: "Kwa nini bendera hii",
    cost: "Inakugharimu nini", illustrate: "Viwango vya mfano, si takwimu za soko.",
    asWritten: "Kama kilivyoandikwa", after: "Baada ya majadiliano",
    approve: "Kubali", reject: "Kataa",
    cleared: "Imeruhusiwa", notCleared: "Hairuhusiwi", needsConsent: "Inahitaji idhini",
    register: "Sajili kazi hii (ninakubali)", sell: "Orodhesha pia kwa kuuza",
    issue: "Toa pasipoti", intact: "Sahihi", tampered: "Imebadilishwa",
    tamper: "Jaribio la kuharibu (badilisha herufi moja)",
    whyScore: "Kwa nini namba hii", health: "Afya ya haki, si mkopo",
    next: "Hatua bora zijazo",
  },
} as const;

export function t(lang: Lang, key: keyof typeof ui.en): string {
  return ui[lang][key];
}
