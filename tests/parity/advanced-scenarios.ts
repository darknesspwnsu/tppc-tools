import type { ParityScenario } from "./scenarios";

function normalizeText(v: string | null | undefined) {
  return String(v || "").replace(/\r\n/g, "\n").trim();
}

export const ADVANCED_PARITY_SCENARIOS: readonly ParityScenario[] = [
  {
    id: "box-organizer-options-matrix",
    slug: "box-organizer",
    legacyPath: "/box_organizer.html",
    canonicalPath: "/tools/box-organizer/",
    async run(page) {
      await page.waitForSelector("#input");
      await page.fill(
        "#input",
        [
          "GoldenMew (?) (Level: 5)",
          "ShinyMew (?) (Level: 6)",
          "DarkMew (?) (Level: 7)",
          "Mew (?) (Level: 8)"
        ].join("\n")
      );
      await page.check("#combine");
      await page.check("#combineSD");
      await page.check("#dedicatedUnknown");
      await page.click("#sortBtn");
    },
    async extract(page) {
      return {
        output: normalizeText(await page.$eval("#output", (el) => (el as HTMLTextAreaElement).value)),
        status: normalizeText(await page.textContent("#status"))
      };
    }
  },
  {
    id: "sell-guide-formula-mode",
    slug: "sell-guide",
    legacyPath: "/sell_guide.html",
    canonicalPath: "/tools/sell-guide/",
    async run(page) {
      await page.waitForSelector("#moneyInput");
      await page.fill("#moneyInput", "250");
      await page.check("#meaningSellerGets");
      await page.waitForTimeout(120);
    },
    async extract(page) {
      return {
        modeBadge: normalizeText(await page.textContent("#modeBadge")),
        formulaLatex: normalizeText(await page.textContent("#formulaLatex")),
        status: normalizeText(await page.textContent("#status"))
      };
    }
  },
  {
    id: "pokesprite-advanced-render",
    slug: "pokesprite-generator",
    legacyPath: "/pokesprite_generator.html",
    canonicalPath: "/tools/pokesprite-generator/",
    async run(page) {
      await page.waitForSelector("#pokeInput");
      await page.fill("#pokeInput", "Pikachu");
      await page.evaluate(() => {
        const details = Array.from(document.querySelectorAll("details")).find((el) =>
          /advanced options/i.test((el.querySelector("summary")?.textContent || "").trim())
        ) as HTMLDetailsElement | undefined;
        if (details) details.open = true;
      });
      await page.waitForSelector("#resMode", { state: "visible" });
      await page.selectOption("#resMode", "custom");
      await page.fill("#cols", "64");
      await page.fill("#alpha", "20");
      await page.click("#renderBtn");
      await page.waitForFunction(() => {
        const out = document.querySelector("#bbcodeOut") as HTMLTextAreaElement | null;
        return Boolean(out && out.value.trim().length > 0);
      });
    },
    async extract(page) {
      return {
        status: normalizeText(await page.textContent("#status")),
        bbcodeOut: normalizeText(await page.$eval("#bbcodeOut", (el) => (el as HTMLTextAreaElement).value))
      };
    }
  }
];
