import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { claimReminder, getDayLog, getPlan, listCompletedDates, saveDayLog, savePlan } from "./db";
import type { SavedPlan } from "./types";

const plan: SavedPlan = {
  id: "current",
  savedAt: "2026-10-11T12:00:00.000Z",
  rescanWeeks: 4,
  morningTime: "08:00",
  eveningTime: "21:00",
  steps: [
    {
      id: "morning:cleanser:wash:0",
      period: "morning",
      groupKey: "cleanser",
      groupTitle: "Cleanser",
      productName: "Gentle Cream Cleanser",
    },
  ],
};

describe("indexedDB plan storage", () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("face-age-routine-planner");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
  });

  it("round-trips a plan and drops fields that are not names", async () => {
    const extra = { ...plan, image: "https://example.com/photo.jpg" } as SavedPlan & { image: string };
    await savePlan(extra);
    const stored = await getPlan();
    expect(stored?.steps[0]?.productName).toBe("Gentle Cream Cleanser");
    expect(JSON.stringify(stored)).not.toMatch(/image|photo/);
  });

  it("marks a day complete only when every current step is checked", async () => {
    await savePlan(plan);
    await saveDayLog({ date: "2026-10-11", checkedStepIds: [] });
    expect(await listCompletedDates(plan.steps)).toEqual([]);
    await saveDayLog({ date: "2026-10-11", checkedStepIds: [plan.steps[0].id] });
    expect(await listCompletedDates(plan.steps)).toEqual(["2026-10-11"]);
    expect((await getDayLog("2026-10-12")).checkedStepIds).toEqual([]);
  });

  it("claims each reminder id once", async () => {
    expect(await claimReminder("morning:2026-10-11")).toBe(true);
    expect(await claimReminder("morning:2026-10-11")).toBe(false);
  });
});
