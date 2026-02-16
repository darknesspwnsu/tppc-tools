import fs from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { PARITY_SCENARIOS, installDeterministicNetwork, waitForToolRuntime } from "./scenarios";

const ROOT = process.cwd();

async function loadGolden(id: string) {
  const file = path.join(ROOT, "tests", "parity", "golden", `${id}.json`);
  const raw = await fs.readFile(file, "utf8");
  const parsed = JSON.parse(raw) as { snapshot: Record<string, string> };
  return parsed.snapshot;
}

for (const scenario of PARITY_SCENARIOS) {
  test(`parity: ${scenario.id}`, async ({ page }) => {
    await installDeterministicNetwork(page);

    await page.goto(scenario.canonicalPath, { waitUntil: "domcontentloaded" });
    await waitForToolRuntime(page);
    await scenario.run(page);

    const expected = await loadGolden(scenario.id);
    const actual = await scenario.extract(page);

    expect(actual).toEqual(expected);

    await expect(page.locator("iframe")).toHaveCount(0);
    const bodyText = (await page.textContent("body")) || "";
    expect(bodyText).not.toContain("Legacy Runtime");
    expect(bodyText).not.toContain("embedded for compatibility");
  });
}

test("gold-organizer native route works without iframe", async ({ page }) => {
  await page.goto("/tools/gold-organizer/", { waitUntil: "domcontentloaded" });

  await page.fill(
    "#input",
    ["GoldenBulbasaur (Level: 5)", "GoldenIvysaur (Level: 6)", "DarkPikachu (Level: 10)"].join("\n")
  );
  await page.click("button:has-text('Sort Golds')");
  await page.waitForFunction(() => {
    const out = document.querySelector("#output") as HTMLTextAreaElement | null;
    return Boolean(out && out.value.trim().length > 0);
  });

  const output = await page.$eval("#output", (el) => (el as HTMLTextAreaElement).value);
  expect(output).toContain("Completion:");
  await expect(page.locator("iframe")).toHaveCount(0);
});
