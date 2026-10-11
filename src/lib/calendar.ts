import { createEvents, type EventAttributes } from "ics";
import { nextLocalOccurrence, rescanMoment } from "./dates";
import { COSMETIC_DISCLAIMER, type SavedPlan } from "./types";

function parts(date: Date): [number, number, number, number, number] {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()];
}

function names(plan: SavedPlan, period: "morning" | "evening"): string {
  return plan.steps
    .filter((step) => step.period === period)
    .map((step) => `${step.groupTitle}: ${step.productName}`)
    .join("; ");
}

export function buildCalendar(plan: SavedPlan, now = new Date()): string {
  const morningStart = nextLocalOccurrence(plan.morningTime, now);
  const eveningStart = nextLocalOccurrence(plan.eveningTime, now);
  const rescanStart = rescanMoment(plan.savedAt, plan.rescanWeeks);
  const shared = {
    productId: "face-age-routine-planner",
    status: "CONFIRMED" as const,
    url: "https://getfaceage.com/",
    categories: ["skincare", "routine"],
  };

  const events: EventAttributes[] = [
    {
      ...shared,
      title: "Morning skincare routine",
      description: `Morning checklist: ${names(plan, "morning")}. ${COSMETIC_DISCLAIMER}`,
      start: parts(morningStart),
      startInputType: "local",
      startOutputType: "local",
      duration: { minutes: 20 },
      recurrenceRule: "FREQ=DAILY",
      uid: `morning-${plan.savedAt}@routine-planner.local`,
      alarms: [
        {
          action: "display",
          description: "Morning skincare routine",
          trigger: { minutes: 5, before: true },
        },
      ],
    },
    {
      ...shared,
      title: "Evening skincare routine",
      description: `Evening checklist: ${names(plan, "evening")}. ${COSMETIC_DISCLAIMER}`,
      start: parts(eveningStart),
      startInputType: "local",
      startOutputType: "local",
      duration: { minutes: 20 },
      recurrenceRule: "FREQ=DAILY",
      uid: `evening-${plan.savedAt}@routine-planner.local`,
      alarms: [
        {
          action: "display",
          description: "Evening skincare routine",
          trigger: { minutes: 5, before: true },
        },
      ],
    },
  ];

  if (!Number.isNaN(rescanStart.getTime())) {
    events.push({
      ...shared,
      title: "Rescan your skin routine",
      description: `Rescan with Face Age and refresh this cosmetic checklist. ${COSMETIC_DISCLAIMER}`,
      start: parts(rescanStart),
      startInputType: "local",
      startOutputType: "local",
      duration: { minutes: 30 },
      uid: `rescan-${plan.savedAt}@routine-planner.local`,
      alarms: [
        {
          action: "display",
          description: "Time to rescan",
          trigger: { minutes: 5, before: true },
        },
      ],
    });
  }

  const result = createEvents(events, {
    productId: "face-age-routine-planner",
    calName: "Skincare routine",
  });
  if (result.error || !result.value) {
    throw result.error ?? new Error("Could not build the calendar file.");
  }
  return result.value;
}

export function downloadCalendar(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
