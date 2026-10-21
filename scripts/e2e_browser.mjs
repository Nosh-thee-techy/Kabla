// Browser click-through of every Kabla room. Why: unit tests prove the API; this proves a person can
// actually walk Before -> During -> After in a real browser, and records a per-room pass/fail table.
// Order (work-first, confirmed by the student on 2026-10-21): landing -> sign in -> wizard (with audience numbers) ->
// Register your work -> Your work passport -> Desk -> Clause map -> Simulator -> Theater -> Sign check -> Licence ->
// Financier -> Verify.
//
// Needs: the API (:8000, or another port that vite's proxy points at: KABLA_API_PROXY=http://localhost:8001 npx vite),
// `npx vite` on :5173, and playwright-core installed in .vendor/e2e
// (npm install playwright-core). It drives the machine's own Chrome (channel "chrome"), so no browser download.
// Output: docs/E2E.md (table) and docs/evidence/e2e/*.png. Synthetic data only.
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const require = createRequire(path.join(root, ".vendor", "e2e", "package.json"));
const { chromium } = require("playwright-core");

const BASE = process.env.KABLA_WEB || "http://127.0.0.1:5173";
const shots = path.join(root, "docs", "evidence", "e2e");
mkdirSync(shots, { recursive: true });

const results = [];
let page;
const T = Number(process.env.KABLA_E2E_T) || 45000; // every wait is capped: a stuck room fails, it does not hang the run (raise it on a slow machine)

async function room(name, fn) {
  const t0 = Date.now();
  try {
    const note = await fn();
    results.push({ name, ok: true, note: note || "", ms: Date.now() - t0 });
  } catch (e) {
    results.push({ name, ok: false, note: String(e.message || e).split("\n")[0].slice(0, 200), ms: Date.now() - t0 });
  }
  await page.screenshot({ path: path.join(shots, `${name.replace(/\W+/g, "-").toLowerCase()}.png`) }).catch(() => {});
}

// Karani pauses a room the first time a cue appears and dims it; a person taps "Later". So must the test.
async function dismiss() {
  const later = page.getByRole("button", { name: /^Later$/ });
  // The card slides in a moment after the room opens, so give it a short moment to appear before deciding it is absent.
  await later.first().waitFor({ state: "visible", timeout: 2500 }).catch(() => {});
  if (await later.first().isVisible().catch(() => false)) await later.first().click();
}
// Client-side navigation through the journey rail (clicking is what a visitor does; the reload case has its own row).
async function nav(label) {
  await dismiss();
  await page.getByRole("navigation", { name: /Journey/i }).getByRole("link", { name: new RegExp(`^\\d+\\s*${label}(?![a-z])`) }).click();
  await dismiss();
}
const btn = (re) => page.getByRole("button", { name: re }).first();
const see = (re) => page.getByText(re).first().waitFor({ timeout: T });
const shot = (file) => page.screenshot({ path: path.join(shots, file) }).catch(() => {});

const browser = await chromium.launch({ channel: "chrome", headless: true });
page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(T);
const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 160)));

await room("00 load", async () => {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await see(/Read your music contract with someone on your side/i);   // the landing page is the front door
  await see(/SYNTHETIC/);
  await see(/Demo sign-in/);                                            // honest label: no password, no real account
  await see(/What Kabla is not/i);
  await shot("landing-desktop.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(shots, "landing-390.png"), fullPage: true }).catch(() => {});
  await page.setViewportSize({ width: 1280, height: 900 });
});

await room("00b landing: Sign in with nothing stored says so", async () => {
  await page.getByRole("link", { name: /^Sign in$/ }).first().click();
  await see(/No demo profile on this device/i);
  await see(/Real accounts: planned next/i);
  await page.goBack();
});

// Landing -> Start -> demo sign-in -> 3-step wizard -> Ready. The last step makes the same API call as the You room.
await room("01 before: landing, demo sign-in, wizard + seal", async () => {
  await page.getByRole("link", { name: /^Start$/ }).first().click();
  await see(/Demo sign-in: stays on this device, no password, no real account/);
  await see(/Real accounts: planned next/i);
  await page.getByPlaceholder(/your first name/i).fill("Test Visitor");
  await shot("signin.png");
  await btn(/^Continue$/).click();
  await see(/Step 1 of 3/);
  await shot("wizard-1.png");
  await btn(/^Next$/).click();
  await see(/Step 2 of 3/);
  await see(/Kabla never opens these accounts/i);
  // Audience signals: typed by the musician, labelled self-reported, never fetched. Kept for the passport and Financier cards.
  await see(/Self-reported, not verified/);
  await see(/never opens Instagram, TikTok, Facebook, Spotify or YouTube/i);
  await page.locator('[data-aud="instagram"]').fill("4200");
  await page.locator('[data-aud="tiktok"]').fill("800");
  await page.locator('[data-aud="spotify"]').fill("1500");
  await page.locator('[data-aud="likes"]').fill("150");
  await page.locator('[data-aud="note"]').fill("Most listeners are in Nairobi.");
  await shot("wizard-2.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(shots, "wizard-2-390.png"), fullPage: true }).catch(() => {});
  await page.setViewportSize({ width: 1280, height: 900 });
  await btn(/^Next$/).click();
  await see(/Step 3 of 3/);
  await btn(/Fill in the demo artist/i).click();
  await page.getByRole("checkbox").first().check();
  await shot("wizard-3.png");
  await btn(/Seal my profile/i).click();
  await see(/You are ready/i);
  await see(/Audience \(self-reported\)/i);        // the typed numbers are in the summary, labelled as self-reported
  await shot("wizard-ready.png");
  await btn(/Check the seal/i).click();
  await see(/Seal intact/i);
  await see(/still missing/i);
});

await room("01b before: wizard's last button leads to Register your work; You room keeps profile and audience", async () => {
  await btn(/^Register your work$/i).click();                    // the Ready screen no longer ends at the Desk
  await page.waitForURL(/\/passport$/, { timeout: T });
  await dismiss();
  await see(/Register your work/i);
  await nav("You");
  await see(/Tell Kabla who you are/i);
  await see(/Profile sealed/i);                   // the wizard's profile is the same state the You room reads
  await see(/Your audience/i);
  await see(/Self-reported, not verified/i);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(shots, "01b-you-room.png"), fullPage: true }).catch(() => {});
});

// The Desk must warn (never block) when the chosen work has no passport yet, and link to Register.
await room("01c during: Desk warns that the work is not registered yet", async () => {
  await nav("Desk");
  await see(/Register this work first so your rights are clear before you sign/i);
  await see(/Kabla does not block you/i);
  await page.getByRole("button", { name: /Mawingu/i }).first().waitFor({ timeout: T });   // folders are still usable: warn, not block
  await shot("01c-desk-note-desktop.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(shots, "01c-desk-note-390.png"), fullPage: true }).catch(() => {});
  await page.setViewportSize({ width: 1280, height: 900 });
});

// BEFORE stage: register the work and get the work passport, with NO contract analysed yet.
await room("02 before: register the work (no contract yet)", async () => {
  await page.getByRole("link", { name: /Register your work/i }).filter({ hasText: /→/ }).first().click();
  await page.waitForURL(/\/passport$/, { timeout: T });
  await dismiss();
  await see(/Register your work/i);
  await see(/Asali ya Jioni/);
  await see(/Who owns what/i);
  await see(/Co-writer shares add up to 100%/i);
  await see(/Every co-writer's yes/i);
  await see(/Baraka said yes/i);
  await see(/Your AI rule/i);
  await see(/What registering does/i);
  await see(/set your limits/i);                     // the ready-check loads from the work alone
  await see(/On the roadmap: a work passport you can anchor on a public chain \(an NFT-style token\)/i);
  await see(/Today there is no token and no chain/i);
  await page.getByRole("checkbox").first().check().catch(() => {});
  await shot("02a-register-desktop.png");
  await page.screenshot({ path: path.join(shots, "02a-register-desktop-full.png"), fullPage: true }).catch(() => {});
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(shots, "02b-register-390.png"), fullPage: true }).catch(() => {});
  await page.setViewportSize({ width: 1280, height: 900 });
  await btn(/Register my work and make my passport/i).click();
  await page.waitForURL(/\/passport\/issued/, { timeout: T });   // success moves on to the work passport
});

await room("03 before: your work passport, Rights check next to Audience credibility", async () => {
  await dismiss();
  await see(/Your work passport/i);
  await see(/Rights check \(not a credit score\)/i);
  await see(/Audience credibility/i);
  await see(/Self-reported, not verified/);
  await see(/Why this number/i);
  const card = page.getByTestId("audience-card");
  await card.getByText(/^6,500$/).waitFor({ timeout: T });             // 4200 + 800 + 1500, added up by the page's API
  await card.getByText(/^Growing$/).waitFor({ timeout: T });          // plain band
  await card.getByText(/^3%$/).waitFor({ timeout: T });               // 150 likes / (4200 + 800) followers
  await card.getByText(/does not change your Rights check/i).waitFor({ timeout: T });
  await card.getByText(/How this was worked out/i).click();
  await see(/divided by your followers/i);
  await see(/On the roadmap: a work passport you can anchor on a public chain/i);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(shots, "03a-passport-desktop.png"), fullPage: true }).catch(() => {});
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(shots, "03b-passport-390.png"), fullPage: true }).catch(() => {});
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await dismiss();
  await see(/Why this number/i);                   // the passport is kept in sessionStorage, so the page is still filled in
});

await room("04 during: desk reads a contract (work is registered)", async () => {
  await nav("Desk");
  await see(/Profile:/);                         // the Before profile is visible on the desk
  await see(/Your work is registered/i);         // the warning is gone
  await shot("04-desk-registered.png");
  await page.getByRole("button", { name: /Mawingu/i }).first().click();
  await page.waitForURL(/\/map/, { timeout: T });
});

await room("05 during: clause map + MeTTa trail", async () => {
  await see(/red/i);
  const clause = page.locator("[data-clause], button:has-text('Clause'), li button").first();
  await clause.click({ timeout: 5000 }).catch(() => {});
  await see(/Why this flag|MeTTa trail/i);
});

// A reload mid-demo must keep the visitor's place (state is kept in sessionStorage, web/src/state.tsx).
await room("05b reload keeps the open contract and profile", async () => {
  await page.reload({ waitUntil: "domcontentloaded" });
  await dismiss();
  await see(/red/i);                               // still on the clause map with the analysis
  await page.getByRole("navigation", { name: /Journey/i }).getByRole("link", { name: /^\d+\s*Desk/ }).click();
  await dismiss();
  await see(/Profile:/);                           // and the sealed Before profile is still there
});

await room("06 during: simulator", async () => {
  await nav("Simulator");
  await see(/Example numbers/i);
  await see(/What you keep/i);                   // the two result cards (as written / after) have loaded
});

await room("07 during: theater negotiation", async () => {
  await nav("Theater");
  await dismiss();
  await page.waitForTimeout(500);
  await shot("05a-theater-before-curtain.png");          // curtain still down
  await dismiss();
  if (await btn(/Raise the curtain/i).isVisible().catch(() => false)) await btn(/Raise the curtain/i).click();
  await see(/Offers from the label|counter-offers/i);
  await dismiss();
  await page.waitForTimeout(1800);                        // let the curtain finish opening
  await shot("05b-theater-mid-round.png");               // stage, tug-of-war bars, contract cards
  await dismiss();
  // Stamp round after round until the curtain comes down (agreed, standoff or walk-away); a round can be slow (the engine runs).
  for (let i = 0; i < 5; i++) {
    await dismiss();
    if (!(await btn(/Stamp these decisions/i).isVisible().catch(() => false))) break;
    await btn(/Stamp these decisions/i).click();
    await page.waitForTimeout(900);
    await page.waitForFunction(() => {
      const b = [...document.querySelectorAll("button")].find((x) => /Stamp these decisions/.test(x.textContent || ""));
      return !b || !b.disabled;
    }, null, { timeout: T });
  }
  await see(/Ledger|agreed|standoff|walk-away|Act 2/i);
  await dismiss();
  await page.waitForTimeout(1800);
  await see(/who gave up what/i);                        // the ending scene is on screen
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(shots, "05c-theater-curtain-down.png"), fullPage: true }).catch(() => {});            // ending scene: ledger, before/after, licence desk button
  await see(/See your sign check/i);                      // the readiness block is now one small card with a way to the Sign check room
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await shot("05d-theater-bottom.png");                   // bottom of the Theater: just the compact readiness card
});

await room("07e during: sign check room", async () => {
  await dismiss();
  await page.getByRole("link", { name: /See your sign check/i }).first().click();
  await page.waitForURL(/\/check/, { timeout: T });
  await dismiss();
  await see(/As written/);
  await see(/What is holding it back/i);
  await see(/Already in good shape/i);
  await see(/Before you sign/i);
  await see(/Round by round/i);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(shots, "05e-sign-check-desktop.png"), fullPage: true }).catch(() => {});
  await page.getByText(/^Details$/).first().click().catch(() => {});       // raw rule ids hide behind this toggle
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(shots, "05f-sign-check-phone.png"), fullPage: true }).catch(() => {});
  await page.setViewportSize({ width: 1280, height: 900 });
});

await room("08 after: licence desk verdict", async () => {
  await nav("Licence desk");
  const env = page.locator("button").filter({ hasText: /envelope|sync|ad |AI|licen/i }).first();
  await env.click();
  await see(/Cleared|Not cleared|Needs consent/);
});

await room("09 after: financier view with both cards", async () => {
  await nav("Financier view");
  await see(/Not a credit score/i);
  await see(/Rights check \(not a credit score\)/i);
  const card = page.getByTestId("audience-card");
  await card.getByText(/Audience credibility/i).waitFor({ timeout: T });
  await card.getByText(/Self-reported, not verified/).waitFor({ timeout: T });
  await card.getByText(/^6,500$/).waitFor({ timeout: T });
  await card.getByText(/^Growing$/).waitFor({ timeout: T });
  await see(/They are separate, and the musician typed them/i);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(shots, "09a-financier-desktop.png"), fullPage: true }).catch(() => {});
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(shots, "09b-financier-390.png"), fullPage: true }).catch(() => {});
  await page.setViewportSize({ width: 1280, height: 900 });
});

await room("10 after: verify + tamper test", async () => {
  await nav("Verify");
  await dismiss();
  await btn(/Tamper test/i).click();
  await page.getByRole("status").filter({ hasText: /Tampered/ }).first().waitFor({ timeout: T });
});

await room("10b chat: Omega agent panel", async () => {
  await nav("Desk");
  await see(/Ask the Omega agent/i);
  await page.getByRole("textbox", { name: /Ask the Omega agent/i }).fill("analyse c001");
  await btn(/^Send$/).click();
  await see(/Agent online|offline or asleep/i);
});

await room("11 sign out / start fresh clears everything", async () => {
  await dismiss();
  const before = await page.evaluate(() => Object.keys(sessionStorage).filter((k) => k.startsWith("kabla:")));
  if (!before.includes("kabla:account") || !before.includes("kabla:profile")) throw new Error(`expected account + profile in storage, saw ${before.join(",")}`);
  await page.getByRole("button", { name: /Sign out \/ start fresh/ }).first().click();
  await see(/Read your music contract with someone on your side/i);
  const after = await page.evaluate(() => Object.keys(sessionStorage).filter((k) => k.startsWith("kabla:")));
  if (after.length) throw new Error(`kabla:* keys left after sign out: ${after.join(",")}`);
  return `cleared ${before.length} key(s)`;
});

await room("12 swahili toggle", async () => {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /^(SW|Kiswahili|Swahili)$/i }).first().click();
  await see(/Soma mkataba wako wa muziki/i);
  await see(/Kuingia kwa onyesho/);
  await shot("landing-sw.png");
});

await browser.close();

const rows = results.map((r) => `| ${r.name} | ${r.ok ? "PASS" : "FAIL"} | ${(r.ms / 1000).toFixed(1)}s | ${r.note.replace(/\|/g, "/")} |`);
const md = `# Browser click-through (Playwright, system Chrome)

Generated by \`scripts/e2e_browser.mjs\` on ${new Date().toISOString()}. Synthetic data only.
Web at \${BASE}. Order: landing, sign in, wizard (with audience numbers), Register your work, Your work passport, Desk, Clause map, Simulator, Theater, Sign check, Licence, Financier, Verify. Screenshots: \`docs/evidence/e2e/\`.

| Room | Result | Time | Note |
|---|---|---|---|
${rows.join("\n")}

Page errors seen in the browser console: ${consoleErrors.length ? "\n- " + consoleErrors.join("\n- ") : "none"}

${results.every((r) => r.ok) ? "All rooms passed." : "Some rooms failed: see Note and the screenshot of that room."}

## What this does and does not prove

- Each row drives the real UI (click, type, tick) and waits for text that only the API/MeTTa answer can produce. It checks
  behaviour, not pixel layout. Rows 05 and 08 are light checks (a flagged clause opens a trail; an envelope returns a verdict).
- Findings while writing it: (1) Karani's first-time card dims the room until "Later" or its button is pressed, so a user who
  ignores it cannot click through; that is by design but easy to miss. (2) The open contract, analysis and profile are kept in
  sessionStorage, so a reload keeps the visitor's place (rows 03 and 05b); a new tab or visit starts clean at Before. (3) Registering needs no
  contract: row 02 runs before any contract is opened. The audience numbers in rows 01 and 03 are typed, self-reported and unverified; nothing is fetched.
- Row 01c checks that the Desk only warns (the folders stay clickable) when the work is not registered yet.
- Row 10 only checks that the chat panel sends and shows agent status. The agent's actual answers are in docs/evidence/omega-chat.md.
`;
writeFileSync(path.join(root, "docs", "E2E.md"), md, "utf8");
console.log(md);
process.exit(results.every((r) => r.ok) ? 0 : 1);
