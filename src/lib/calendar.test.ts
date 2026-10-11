import { describe, expect, it } from "vitest";
import { buildCalendar } from "./calendar";
import { buildPlanSteps } from "./routine";
import { FALLBACK_ROUTINE_GROUPS, ROUTINE_SUPPORT, SAMPLE_PRODUCTS } from "./sampleCatalog";
import type { SavedPlan } from "./types";

describe("buildCalendar", () => {
  it("exports a daily calendar with routine names and a rescan event", () => {
    const plan: SavedPlan = {
      id: "current",
      savedAt: "2026-10-11T12:00:00.000Z",
      rescanWeeks: 4,
      morningTime: "08:00",
      eveningTime: "21:00",
      steps: buildPlanSteps({
        products: SAMPLE_PRODUCTS,
        groups: FALLBACK_ROUTINE_GROUPS,
        routinesSupport: ROUTINE_SUPPORT,
      }),
    };
    const ics = buildCalendar(plan, new Date(2026, 9, 11, 7, 0, 0)).replace(/\r\n[ \t]/g, "");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:Morning skincare routine");
    expect(ics).toContain("SUMMARY:Evening skincare routine");
    expect(ics).toContain("SUMMARY:Rescan your skin routine");
    expect(ics).toContain("RRULE:FREQ=DAILY");
    expect(ics).toContain("TRIGGER:-PT5M");
    expect(ics).toContain("Gentle Cream Cleanser");
    expect(ics).toContain("Restoring Night Cream");
    expect(ics.toLowerCase()).toContain("dermatologist");
    expect(ics).not.toMatch(/https:\/\/static\.getfaceage\.com/);
  });
});
