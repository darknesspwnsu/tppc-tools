import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function loadUeugEntries() {
  const text = fs.readFileSync(path.join(process.cwd(), "public/data/ueug_list.txt"), "utf8");
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

describe("UE/UG source list", () => {
  it("does not classify newly goldenized species as UE/UG", () => {
    const entries = loadUeugEntries();

    expect(entries).not.toContain("Kangaskhan");
    expect(entries).not.toContain("Stantler");
  });
});
