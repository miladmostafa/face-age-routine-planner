import { describe, expect, it } from "vitest";
import { rescanMoment } from "./dates";
import { dueReminders, isRescanDue } from "./reminders";
import type { SavedPlan } from "./types";

function plan(overrides: Partial<SavedPlan> = {}): SavedPlan {
  return {
    id: "current",
    savedAt: "2026-10-11T15:00:00.000Z",
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
    ...overrides,
  };
}

describe("dueReminders", () => {
  it("waits until 8:00 for the morning reminder", () => {
    const early = new Date(2026, 9, 11, 7, 59, 0);
    const onTime = new Date(2026, 9, 11, 8, 0, 0);
    expect(dueReminders(plan(), early, []).map((item) => item.kind)).not.toContain("morning");
    expect(dueReminders(plan(), onTime, []).map((item) => item.kind)).toContain("morning");
  });

  it("does not repeat a reminder that was already sent", () => {
    const onTime = new Date(2026, 9, 11, 8, 5, 0);
    expect(dueReminders(plan(), onTime, ["morning:2026-10-11"])).toHaveLength(0);
  });

  it("includes the evening reminder after 21:00", () => {
    const evening = new Date(2026, 9, 11, 21, 0, 0);
    const kinds = dueReminders(plan(), evening, []).map((item) => item.kind);
    expect(kinds).toEqual(["morning", "evening"]);
  });

  it("reminds the user to rescan after the configured number of weeks", () => {
    const saved = plan({ savedAt: "2026-09-01T15:00:00.000Z", rescanWeeks: 4 });
    const due = rescanMoment(saved.savedAt, saved.rescanWeeks);
    const before = new Date(due.getTime() - 60_000);
    const after = new Date(due.getTime() + 60_000);
    expect(isRescanDue(saved, before)).toBe(false);
    expect(isRescanDue(saved, after)).toBe(true);
    expect(dueReminders(saved, after, []).some((item) => item.kind === "rescan")).toBe(true);
  });

  it("describes the reminder as a cosmetic suggestion", () => {
    const onTime = new Date(2026, 9, 11, 8, 0, 0);
    const morning = dueReminders(plan(), onTime, [])[0];
    expect(morning?.body).toMatch(/Gentle Cream Cleanser/);
    expect(morning?.body.toLowerCase()).toMatch(/dermatologist/);
  });
});
