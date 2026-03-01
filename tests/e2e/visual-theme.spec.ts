import { expect, test } from "@playwright/test";

import { withParityBasePath } from "../parity/shared";

test("light theme uses wooloo background and blue accent token", async ({ page }) => {
  await page.goto(withParityBasePath("/"), { waitUntil: "domcontentloaded" });

  const state = await page.evaluate(() => {
    const root = document.documentElement;
    const bodyStyle = getComputedStyle(document.body);
    const rootStyle = getComputedStyle(root);
    return {
      bgImage: bodyStyle.backgroundImage,
      accent: rootStyle.getPropertyValue("--color-accent").trim()
    };
  });

  expect(state.bgImage).toContain("bg-light-wooloo.jpg");
  expect(state.accent).toBe("#1f63e3");
});

test("dark theme uses yveltal background", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("tppc_tools_theme", "dark");
  });
  await page.goto(withParityBasePath("/tools/box-organizer/"), { waitUntil: "domcontentloaded" });

  await page.waitForFunction(() => document.documentElement.getAttribute("data-theme") === "dark");

  const bgImage = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
  expect(bgImage).toMatch(/bg-dark-yveltal\.(png|jpg)/);
});
