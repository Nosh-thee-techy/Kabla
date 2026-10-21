// Screenshots of every room that carries card text, at desktop and 390px width.
// Why: layout is not covered by e2e_browser.mjs; after the plain-language pass a person should LOOK at each room
// (longer sentences can crowd or overflow a card). Synthetic data only. Same setup as e2e_browser.mjs.
// Output: docs/evidence/e2e/plain-<room>-<desktop|phone>.png
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const { chromium } = createRequire(path.join(root, ".vendor", "e2e", "package.json"))("playwright-core");
const BASE = process.env.KABLA_WEB || "http://localhost:5173";
const out = path.join(root, "docs", "evidence", "e2e");
mkdirSync(out, { recursive: true });
const T = 45000;

const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const [tag, width, height] of [["desktop", 1280, 900], ["phone", 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.setDefaultTimeout(T);
  const later = async () => {
    const b = page.getByRole("button", { name: /^Later$/ }).first();
    await b.waitFor({ state: "visible", timeout: 2000 }).catch(() => {});
    if (await b.isVisible().catch(() => false)) await b.click();
  };
  const shot = async (name) => {
    await later();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(out, `plain-${name}-${tag}.png`), fullPage: true });
    // overflow check: anything wider than the viewport means a card is spilling out sideways
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (wide > 1) console.log(`  OVERFLOW ${wide}px in ${name} (${tag})`);
  };
  const btn = (re) => page.getByRole("button", { name: re }).first();
  const see = (re) => page.getByText(re).first().waitFor({ timeout: T });

  // set-up: demo sign-in and profile
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await later();
  await page.getByRole("link", { name: /^Start$/ }).first().click();
  await page.getByPlaceholder(/your first name/i).fill("Test Visitor");
  await btn(/^Continue$/).click();
  await btn(/^Next$/).click();
  await btn(/^Next$/).click();
  await btn(/Fill in the demo artist/i).click();
  await page.getByRole("checkbox").first().check();
  await btn(/Seal my profile/i).click();
  await see(/You are ready/i);

  await page.goto(`${BASE}/desk`, { waitUntil: "domcontentloaded" });
  await later();
  await shot("1-desk");
  await page.getByRole("button", { name: /Mawingu/i }).first().click();
  await page.waitForURL(/\/map/);
  await see(/red/i);
  await shot("2-map");
  await page.locator("[data-clause], li button").first().click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
  await shot("2b-map-flag-open");

  await page.goto(`${BASE}/theater`, { waitUntil: "domcontentloaded" });
  await later();
  if (await btn(/Raise the curtain/i).isVisible().catch(() => false)) await btn(/Raise the curtain/i).click();
  await see(/Offers from the label/i);
  await later();
  await page.waitForTimeout(2200);
  await shot("3-theater");
  for (let i = 0; i < 5; i++) {
    await later();
    if (!(await btn(/Stamp these decisions/i).isVisible().catch(() => false))) break;
    await btn(/Stamp these decisions/i).click();
    await page.waitForTimeout(900);
    await page.waitForFunction(() => {
      const b = [...document.querySelectorAll("button")].find((x) => /Stamp these decisions/.test(x.textContent || ""));
      return !b || !b.disabled;
    }, null, { timeout: T });
  }
  await page.waitForTimeout(1800);
  await shot("3b-theater-end");

  // The sign check reads the finished negotiation held in memory, so open it from the Theater (a reload would empty it).
  await page.getByText(/See your sign check/i).first().click();
  await page.waitForURL(/\/check/);
  await page.getByText(/How ready you are to sign/i).first().waitFor({ timeout: 90000 });
  await page.getByText(/out of 100/i).first().waitFor({ timeout: 90000 });   // the numbers arrive after the heading
  await page.waitForTimeout(500);
  await shot("4-signcheck");

  await page.goto(`${BASE}/licence`, { waitUntil: "domcontentloaded" });
  await later();
  await shot("5-licence-empty");
  await page.locator("button").filter({ hasText: /request|sync|ad |AI|licen/i }).first().click();
  await see(/Cleared|Not cleared|Needs consent/);
  await shot("5b-licence-verdict");

  await page.goto(`${BASE}/passport`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await shot("6-register");
  await page.getByRole("checkbox").first().check().catch(() => {});
  await btn(/Issue passport/i).click();
  await page.waitForURL(/\/passport\/issued/);
  await see(/Why this number/);
  await shot("7-passport");
  await btn(/Why this number/).click();
  await page.waitForTimeout(500);
  await shot("7b-passport-why");

  await page.goto(`${BASE}/financier`, { waitUntil: "domcontentloaded" });
  await see(/Not a credit score/i);
  // the cards load after the header (the API call can take several seconds)
  await page.waitForFunction(() => (document.querySelector("h1")?.textContent || "").trim() !== "Financier view", null, { timeout: 90000 });
  await page.waitForTimeout(500);
  await shot("8-financier");

  await page.goto(`${BASE}/verify`, { waitUntil: "domcontentloaded" });
  await later();
  await btn(/Tamper test/i).click();
  await page.getByRole("status").filter({ hasText: /Tampered/ }).first().waitFor({ timeout: T });
  await shot("9-verify");
  await page.close();
}
await browser.close();
console.log("done");
