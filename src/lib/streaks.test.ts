import { describe, expect, it } from "vitest";
import { addDays } from "./dates";
import { computeStreak, isDayComplete, recentDateKeys } from "./streaks";
import type { PlanStep } from "./types";

const steps: PlanStep[] = [
  { id: "morning:cleanser:wash:0", period: "morning", groupKey: "cleanser", groupTitle: "Cleanser", productName: "Wash" },
  { id: "evening:serum:serum:0", period: "evening", groupKey: "serum", groupTitle: "Serum", productName: "Serum" },
];

describe("streaks", () => {
  it("counts a day only when every step is checked", () => {
    expect(isDayComplete({ date: "2026-10-11", checkedStepIds: [steps[0].id] }, steps)).toBe(false);
    expect(isDayComplete({ date: "2026-10-11", checkedStepIds: steps.map((step) => step.id) }, steps)).toBe(true);
  });

  it("continues a streak through yesterday when today is still open", () => {
    const today = "2026-10-11";
    const completed = [addDays(today, -1), addDays(today, -2)];
    expect(computeStreak(completed, today)).toBe(2);
  });

  it("breaks the streak when a day is missing", () => {
    const today = "2026-10-11";
    expect(computeStreak([today, addDays(today, -2)], today)).toBe(1);
  });

  it("returns the last seven date keys ending today", () => {
    expect(recentDateKeys("2026-10-11", 7)).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
  });
});
