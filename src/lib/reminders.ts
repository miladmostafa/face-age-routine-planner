import { localDateKey, minutesOfDay, parseTimeToMinutes, rescanMoment } from "./dates";
import { COSMETIC_DISCLAIMER, type Reminder, type SavedPlan } from "./types";

function productList(plan: SavedPlan, period: "morning" | "evening"): string {
  const names = plan.steps.filter((step) => step.period === period).map((step) => step.productName);
  return names.length > 0 ? names.join(", ") : "your saved steps";
}

export function dueReminders(plan: SavedPlan, now: Date, alreadySent: string[]): Reminder[] {
  const sent = new Set(alreadySent);
  const reminders: Reminder[] = [];
  const today = localDateKey(now);
  const nowMinutes = minutesOfDay(now);

  const morningAt = parseTimeToMinutes(plan.morningTime);
  if (morningAt !== null && nowMinutes >= morningAt) {
    const id = `morning:${today}`;
    if (!sent.has(id)) {
      reminders.push({
        id,
        kind: "morning",
        title: "Morning skincare routine",
        body: `Your morning checklist is ready: ${productList(plan, "morning")}. ${COSMETIC_DISCLAIMER}`,
      });
    }
  }

  const eveningAt = parseTimeToMinutes(plan.eveningTime);
  if (eveningAt !== null && nowMinutes >= eveningAt) {
    const id = `evening:${today}`;
    if (!sent.has(id)) {
      reminders.push({
        id,
        kind: "evening",
        title: "Evening skincare routine",
        body: `Your evening checklist is ready: ${productList(plan, "evening")}. ${COSMETIC_DISCLAIMER}`,
      });
    }
  }

  const rescanAt = rescanMoment(plan.savedAt, plan.rescanWeeks);
  if (!Number.isNaN(rescanAt.getTime()) && now.getTime() >= rescanAt.getTime()) {
    const id = `rescan:${plan.savedAt}`;
    if (!sent.has(id)) {
      reminders.push({
        id,
        kind: "rescan",
        title: "Time to rescan",
        body: `It has been ${plan.rescanWeeks} weeks since you saved this routine. Rescan to refresh your cosmetic checklist. ${COSMETIC_DISCLAIMER}`,
      });
    }
  }

  return reminders;
}

export function isRescanDue(plan: SavedPlan, now: Date): boolean {
  const due = rescanMoment(plan.savedAt, plan.rescanWeeks);
  return !Number.isNaN(due.getTime()) && now.getTime() >= due.getTime();
}
