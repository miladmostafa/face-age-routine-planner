import { describe, expect, it } from "vitest";
import { buildPlanSteps } from "./routine";
import { FALLBACK_ROUTINE_GROUPS, ROUTINE_SUPPORT, SAMPLE_PRODUCTS } from "./sampleCatalog";
import { toStoredPlan } from "./plan";
import { DEFAULT_EVENING_TIME, DEFAULT_MORNING_TIME, type SavedPlan } from "./types";

describe("buildPlanSteps", () => {
  it("builds the sample morning and evening checklist from Face Age groups", () => {
    const steps = buildPlanSteps({
      products: SAMPLE_PRODUCTS,
      groups: FALLBACK_ROUTINE_GROUPS,
      routinesSupport: ROUTINE_SUPPORT,
    });
    const morning = steps.filter((step) => step.period === "morning").map((step) => step.productName);
    const evening = steps.filter((step) => step.period === "evening").map((step) => step.productName);
    expect(morning).toEqual([
      "Gentle Cream Cleanser",
      "Brightening Serum",
      "Daily Moisturizer",
      "Broad Spectrum SPF",
    ]);
    expect(evening).toEqual([
      "Gentle Cream Cleanser",
      "Brightening Serum",
      "Daily Moisturizer",
      "Restoring Night Cream",
    ]);
  });

  it("treats an array of routine groups as both periods the group supports", () => {
    const steps = buildPlanSteps({
      products: [{ title: "Foam Wash", routineGroups: ["cleanser"] }],
      groups: FALLBACK_ROUTINE_GROUPS,
      routinesSupport: ["cleanser"],
    });
    expect(steps.map((step) => step.period)).toEqual(["morning", "evening"]);
  });

  it("keeps night-only object groups out of the morning list", () => {
    const steps = buildPlanSteps({
      products: [{ title: "Night Balm", routineGroups: { night: ["nightCream"] } }],
      groups: FALLBACK_ROUTINE_GROUPS,
      routinesSupport: ROUTINE_SUPPORT,
    });
    expect(steps).toHaveLength(1);
    expect(steps[0]?.period).toBe("evening");
    expect(steps[0]?.productName).toBe("Night Balm");
  });

  it("hides empty groups unless showEmptyRoutines is set", () => {
    const hidden = buildPlanSteps({
      products: [],
      groups: FALLBACK_ROUTINE_GROUPS,
      routinesSupport: ["toner"],
    });
    const shown = buildPlanSteps({
      products: [],
      groups: FALLBACK_ROUTINE_GROUPS,
      routinesSupport: ["toner"],
      showEmptyRoutines: true,
    });
    expect(hidden).toHaveLength(0);
    expect(shown.map((step) => step.groupTitle)).toEqual(["Toner", "Toner"]);
  });

  it("stores names only", () => {
    const steps = buildPlanSteps({
      products: SAMPLE_PRODUCTS,
      groups: FALLBACK_ROUTINE_GROUPS,
      routinesSupport: ROUTINE_SUPPORT,
    });
    const plan: SavedPlan = {
      id: "current",
      savedAt: "2026-10-11T08:00:00.000Z",
      rescanWeeks: 4,
      morningTime: DEFAULT_MORNING_TIME,
      eveningTime: DEFAULT_EVENING_TIME,
      steps,
    };
    const stored = JSON.stringify(toStoredPlan(plan));
    expect(stored).not.toMatch(/image|https:|url|price/i);
    expect(stored).toContain("Gentle Cream Cleanser");
  });
});
