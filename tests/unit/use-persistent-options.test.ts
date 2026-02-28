import { describe, expect, it } from "vitest";

import { resolvePersistentOptionsState } from "@/hooks/usePersistentOptions";

type Prefs = {
  filterNormals: boolean;
  maxMissing: string;
};

const DEFAULTS: Prefs = {
  filterNormals: false,
  maxMissing: "20"
};

describe("resolvePersistentOptionsState", () => {
  it("uses persisted data when version matches", () => {
    const raw = JSON.stringify({
      version: 1,
      data: {
        filterNormals: true
      }
    });

    const out = resolvePersistentOptionsState<Prefs>({
      defaults: DEFAULTS,
      rawStorageValue: raw,
      version: 1
    });

    expect(out).toEqual({
      filterNormals: true,
      maxMissing: "20"
    });
  });

  it("applies pending pre-hydration patch over persisted state", () => {
    const raw = JSON.stringify({
      version: 1,
      data: {
        filterNormals: true,
        maxMissing: "10"
      }
    });

    const out = resolvePersistentOptionsState<Prefs>({
      defaults: DEFAULTS,
      rawStorageValue: raw,
      version: 1,
      pendingPatch: {
        filterNormals: false
      }
    });

    expect(out).toEqual({
      filterNormals: false,
      maxMissing: "10"
    });
  });

  it("falls back to defaults on malformed storage and still applies pending patch", () => {
    const out = resolvePersistentOptionsState<Prefs>({
      defaults: DEFAULTS,
      rawStorageValue: "{broken json",
      version: 1,
      pendingPatch: {
        maxMissing: "5"
      }
    });

    expect(out).toEqual({
      filterNormals: false,
      maxMissing: "5"
    });
  });
});
