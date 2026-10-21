// Screenshots of the two passport pages (Register and Your passport) at desktop and phone width.
// Why: layout is not covered by e2e_browser.mjs; this lets a person look at both pages. Synthetic data only.
// Needs the same setup as e2e_browser.mjs (API :8000, vite :5173, playwright-core in .vendor/e2e).
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

const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const [tag, width, height] of [["desktop", 1280, 900], ["phone", 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.setDefaultTimeout(30000);
  const later = async () => {
    const b = page.getByRole("button", { name: /^Later$/ }).first();
    await b.waitFor({ state: "visible", timeout: 2500 }).catch(() => {});
    if (await b.isVisible().catch(() => false)) await b.click();
  };
  const shot = (name) => page.screenshot({ path: path.join(out, `passport-${name}-${tag}.png`), fullPage: true });

  await page.goto(`${BASE}/passport/issued`, { waitUntil: "domcontentloaded" });   // no passport yet: empty state
  await later();
  await shot("0-empty");

  await page.goto(`${BASE}/passport`, { waitUntil: "domcontentloaded" });
  await later();
  await shot("1-register");

  await page.getByRole("button", { name: /Issue passport/i }).click();
  await page.waitForURL(/\/passport\/issued/);
  await later();
  await page.getByText(/Why this number/).first().waitFor();
  await shot("2-issued");
  await page.getByRole("button", { name: /Why this number/ }).click();
  await shot("3-issued-why");
  await page.close();
}
await browser.close();
console.log("done");
