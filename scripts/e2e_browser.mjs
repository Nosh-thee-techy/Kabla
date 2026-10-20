// Browser click-through of every Kabla room. Why: unit tests prove the API; this proves a person can
// actually walk Before -> During -> After in a real browser, and records a per-room pass/fail table.
//
// Needs: API on :8000, `npx vite` on :5173, and playwright-core installed in .vendor/e2e
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
const T = 45000; // every wait is capped: a stuck room fails, it does not hang the run

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
// Client-side navigation through the journey rail (page.goto would reload the app and drop its in-memory state,
// which is itself a known limitation: state is kept in memory, not in the URL or storage).
async function nav(label) {
  await dismiss();
  await page.getByRole("navigation", { name: /Journey/i }).getByRole("link", { name: new RegExp(`^\\d+\\s*${label}`) }).click();
  await dismiss();
}
const btn = (re) => page.getByRole("button", { name: re }).first();
const see = (re) => page.getByText(re).first().waitFor({ timeout: T });

const browser = await chromium.launch({ channel: "chrome", headless: true });
page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(T);
const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 160)));

await room("00 load", async () => {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await see(/Know what you.re signing/i);
  await see(/SYNTHETIC/);
});

await room("01 before: onboard + seal", async () => {
  await nav("You");
  await btn(/Fill in the demo artist/i).click();
  await page.getByRole("checkbox").first().check();
  await btn(/Seal my profile/i).click();
  await see(/Profile sealed/i);
  await dismiss();
  await btn(/Check the seal/i).click();
  await see(/Seal intact/i);
  await see(/still missing/i);
});

await room("02 during: desk reads a contract", async () => {
  await nav("Desk");
  await see(/Profile:/);                         // the Before profile is visible on the desk
  await page.getByRole("button", { name: /Mawingu/i }).first().click();
  await page.waitForURL(/\/map/, { timeout: T });
});

await room("03 during: clause map + MeTTa trail", async () => {
  await see(/red/i);
  const clause = page.locator("[data-clause], button:has-text('Clause'), li button").first();
  await clause.click({ timeout: 5000 }).catch(() => {});
  await see(/Why this flag|MeTTa trail/i);
});

await room("04 during: simulator", async () => {
  await nav("Simulator");
  await see(/Illustrative/i);
});

await room("05 during: theater negotiation", async () => {
  await nav("Theater");
  await dismiss();
  if (await btn(/Raise the curtain/i).isVisible().catch(() => false)) await btn(/Raise the curtain/i).click();
  await see(/Counter-offers from the label|counter-offers/i);
  await dismiss();
  await btn(/Stamp these decisions/i).click();
  await see(/Ledger|agreed|standoff|walk-away|Act 2/i);
});

await room("06 after: licence desk verdict", async () => {
  await nav("Licence desk");
  const env = page.locator("button").filter({ hasText: /envelope|sync|ad |AI|licen/i }).first();
  await env.click();
  await see(/Cleared|Not cleared|Needs consent/);
});

await room("07 after: passport issue", async () => {
  await nav("Passport");
  await page.getByRole("checkbox").first().check().catch(() => {});
  await dismiss();
  await btn(/Issue passport/i).click();
  await see(/Intact|hash|Rights passport/i);
});

await room("08 after: financier view", async () => {
  await nav("Financier view");
  await see(/Not a credit score/i);
});

await room("09 after: verify + tamper test", async () => {
  await nav("Verify");
  await dismiss();
  await btn(/Tamper test/i).click();
  await see(/Tampered|broken/i);
});

await room("10 chat: Omega agent panel", async () => {
  await nav("Desk");
  await see(/Ask the Omega agent/i);
  await page.getByRole("textbox", { name: /Ask the Omega agent/i }).fill("analyse c001");
  await btn(/^Send$/).click();
  await see(/Agent online|offline or asleep/i);
});

await room("11 swahili toggle", async () => {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /^(SW|Kiswahili|Swahili)$/i }).first().click();
  await see(/Jua unachosaini/i);
});

await browser.close();

const rows = results.map((r) => `| ${r.name} | ${r.ok ? "PASS" : "FAIL"} | ${(r.ms / 1000).toFixed(1)}s | ${r.note.replace(/\|/g, "/")} |`);
const md = `# Browser click-through (Playwright, system Chrome)

Generated by \`scripts/e2e_browser.mjs\` on ${new Date().toISOString()}. Synthetic data only.
API on :8000, web on :5173. Screenshots: \`docs/evidence/e2e/\`.

| Room | Result | Time | Note |
|---|---|---|---|
${rows.join("\n")}

Page errors seen in the browser console: ${consoleErrors.length ? "\n- " + consoleErrors.join("\n- ") : "none"}

${results.every((r) => r.ok) ? "All rooms passed." : "Some rooms failed: see Note and the screenshot of that room."}

## What this does and does not prove

- Each row drives the real UI (click, type, tick) and waits for text that only the API/MeTTa answer can produce. It checks
  behaviour, not pixel layout. Rows 03 and 06 are light checks (a flagged clause opens a trail; an envelope returns a verdict).
- Findings while writing it: (1) Karani's first-time card dims the room until "Later" or its button is pressed, so a user who
  ignores it cannot click through; that is by design but easy to miss. (2) The open contract and the profile live in memory:
  a full page reload sends the visitor back to the Before page. Both are listed in docs/NEXT.md.
- Row 10 only checks that the chat panel sends and shows agent status. The agent's actual answers are in docs/evidence/omega-chat.md.
`;
writeFileSync(path.join(root, "docs", "E2E.md"), md, "utf8");
console.log(md);
process.exit(results.every((r) => r.ok) ? 0 : 1);
