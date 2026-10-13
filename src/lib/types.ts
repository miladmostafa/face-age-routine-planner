export type Period = "morning" | "evening";

export type RoutineGroupInfo = {
  key: string;
  title: string;
  status?: string[];
};

export type PlanStep = {
  id: string;
  period: Period;
  groupKey: string;
  groupTitle: string;
  productName: string;
};

export type SavedPlan = {
  id: "current";
  savedAt: string;
  rescanWeeks: number;
  morningTime: string;
  eveningTime: string;
  steps: PlanStep[];
};

export type DayLog = {
  date: string;
  checkedStepIds: string[];
};

export type ReminderKind = "morning" | "evening" | "rescan";

export type Reminder = {
  id: string;
  kind: ReminderKind;
  title: string;
  body: string;
};

export const DEFAULT_MORNING_TIME = "08:00";
export const DEFAULT_EVENING_TIME = "21:00";
export const DEFAULT_RESCAN_WEEKS = 4;

export const COSMETIC_DISCLAIMER =
  "These steps are cosmetic suggestions, not a diagnosis or treatment. Consult a dermatologist for medical issues.";
