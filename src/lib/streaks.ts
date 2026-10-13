import { addDays } from "./dates";
import type { DayLog, PlanStep } from "./types";

export function isDayComplete(log: DayLog, steps: PlanStep[]): boolean {
  if (steps.length === 0) return false;
  const checked = new Set(log.checkedStepIds);
  return steps.every((step) => checked.has(step.id));
}

export function computeStreak(completedDates: string[], today: string): number {
  const done = new Set(completedDates);
  let day = done.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (done.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

export function recentDateKeys(today: string, count = 7): string[] {
  const days: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    days.push(addDays(today, -offset));
  }
  return days;
}
