import { parseTimeToMinutes } from "./dates";
import {
  DEFAULT_EVENING_TIME,
  DEFAULT_MORNING_TIME,
  DEFAULT_RESCAN_WEEKS,
  type PlanStep,
  type SavedPlan,
} from "./types";

export function clampRescanWeeks(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_RESCAN_WEEKS;
  return Math.min(52, Math.max(1, Math.round(value)));
}

export function normalizeTime(value: string, fallback: string): string {
  return parseTimeToMinutes(value) === null ? fallback : value;
}

export function toStoredPlan(plan: SavedPlan): SavedPlan {
  const steps: PlanStep[] = plan.steps.map((step) => ({
    id: step.id,
    period: step.period,
    groupKey: step.groupKey,
    groupTitle: step.groupTitle,
    productName: step.productName,
  }));
  return {
    id: "current",
    savedAt: plan.savedAt,
    rescanWeeks: clampRescanWeeks(plan.rescanWeeks),
    morningTime: normalizeTime(plan.morningTime, DEFAULT_MORNING_TIME),
    eveningTime: normalizeTime(plan.eveningTime, DEFAULT_EVENING_TIME),
    steps,
  };
}
