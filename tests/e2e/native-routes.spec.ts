import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { installDeterministicNetwork } from "../parity/scenarios";
import { withParityBasePath } from "../parity/shared";

const NATIVE_TOOL_ROUTES = [
  "/tools/box-organizer/",
  "/tools/evolution-viewer/",
  "/tools/exp-utilities/",
  "/tools/gold-organizer/",
  "/tools/perfect-exp/",
  "/tools/pokesprite-generator/",
  "/tools/rainbow-dex/",
  "/tools/sell-guide/",
  "/tools/ungendered-diff/",
  "/tools/ungendered-families/",
  "/tools/ungendered-sorter/"
] as const;

async function stubClipboard(page: Page) {
  await page.addInitScript(() => {
    const clipboard = {
      writeText: async (text: string) => {
        (window as { __copiedText?: string }).__copiedText = text;
      }
    };

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: clipboard
    });
  });
}

test("all native tool routes render without iframe", async ({ page }) => {
  for (const route of NATIVE_TOOL_ROUTES) {
    await page.goto(withParityBasePath(route), { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("iframe")).toHaveCount(0);
  }
});

test("pokesprite copy and export actions work", async ({ page }) => {
  await installDeterministicNetwork(page);
  await stubClipboard(page);

  await page.goto(withParityBasePath("/tools/pokesprite-generator/"), { waitUntil: "domcontentloaded" });

  await expect(page.locator("#status")).toContainText("Loaded");
  await page.fill("#pokeInput", "Pikachu");
  await page.click("#renderBtn");
  await page.waitForFunction(() => {
    const out = document.querySelector("#bbcodeOut") as HTMLTextAreaElement | null;
    return Boolean(out && out.value.trim().length > 0);
  });

  await page.click("#copyBtn");
  await expect(page.locator("#copyBtn")).toContainText("Copied");

  const copied = await page.evaluate(() => (window as { __copiedText?: string }).__copiedText || "");
  expect(copied).toContain("[code]");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click("#exportBtn")
  ]);
  expect(download.suggestedFilename()).toBe("pikachu.png");
});

test("evolution viewer copy action works", async ({ page }) => {
  await stubClipboard(page);

  await page.goto(withParityBasePath("/tools/evolution-viewer/"), { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => {
    const list = document.querySelector("#pokeList") as HTMLDataListElement | null;
    return Boolean(list && list.options.length > 100);
  });

  await page.fill("#pokeInput", "bulbasaur");
  await page.waitForFunction(() => {
    const out = document.querySelector("#jsonOut") as HTMLTextAreaElement | null;
    return Boolean(out && out.value.trim().length > 0);
  });

  await page.click("#copyBtn");
  await expect(page.locator("#copyBtn")).toContainText("Copied!");

  const copied = await page.evaluate(() => (window as { __copiedText?: string }).__copiedText || "");
  expect(copied).toContain("bulbasaur");
});

test("ungendered-sorter renders under reduced motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(withParityBasePath("/tools/ungendered-sorter/"), { waitUntil: "domcontentloaded" });
  await expect(page.locator("#runButton")).toBeVisible();
  const reduced = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  expect(reduced).toBe(true);
});
