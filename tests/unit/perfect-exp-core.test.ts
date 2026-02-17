import { describe, expect, it } from "vitest";

import { findOptimalTrainers, topTrainerOptions, trainerExp } from "@/features/perfect-exp/core";
import type { TrainersTable } from "@/features/perfect-exp/types";

const TABLE: TrainersTable = {
  data: [
    { name: "300 XP Gym", number: 3487664, expDay: 1800, expNight: 1800, level: "10" },
    { name: "1 XP Gym", number: 2380615, expDay: 18, expNight: 18, level: "5" },
    { name: "shedinja w/ EXP SHARE", number: 2380615, expDay: 1, expNight: 1, level: "1" }
  ]
};

describe("perfect-exp core", () => {
  it("reads day/night exp consistently", () => {
    expect(trainerExp(TABLE.data[0], false)).toBe(1800);
    expect(trainerExp(TABLE.data[0], true)).toBe(1800);
  });

  it("provides top trainer options sorted by exp", () => {
    const options = topTrainerOptions(TABLE, false, 2);
    expect(options.map((x) => x.name)).toEqual(["300 XP Gym", "1 XP Gym"]);
  });

  it("builds the optimal trainer plan", () => {
    const out = findOptimalTrainers(1, 2000, TABLE, false, true);
    expect(Object.keys(out)).toEqual([
      "300 XP Gym (3487664)",
      "1 XP Gym (2380615)",
      "shedinja w/ EXP SHARE (2380615)"
    ]);
  });
});
