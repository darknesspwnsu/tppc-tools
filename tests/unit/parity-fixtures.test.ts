import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { PARITY_SCENARIOS } from "../parity/scenarios";

describe("parity fixture set", () => {
  it("has a golden fixture for every parity scenario", () => {
    for (const scenario of PARITY_SCENARIOS) {
      const file = path.join(process.cwd(), "tests", "parity", "golden", `${scenario.id}.json`);
      expect(fs.existsSync(file), `Missing fixture: ${file}`).toBe(true);

      const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as { snapshot?: Record<string, string> };
      expect(parsed.snapshot && Object.keys(parsed.snapshot).length > 0, `Empty fixture: ${file}`).toBe(true);
    }
  });
});
