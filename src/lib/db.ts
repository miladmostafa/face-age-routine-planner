import { openDB, type IDBPDatabase } from "idb";
import { toStoredPlan } from "./plan";
import type { DayLog, PlanStep, SavedPlan } from "./types";

const DB_NAME = "face-age-routine-planner";
const DB_VERSION = 1;

type ReminderRecord = {
  id: string;
  sentAt: string;
};

type PlannerSchema = {
  plan: { key: string; value: SavedPlan };
  days: { key: string; value: DayLog };
  reminders: { key: string; value: ReminderRecord };
};

async function withDb<T>(fn: (db: IDBPDatabase<PlannerSchema>) => Promise<T>): Promise<T> {
  const db = await openDB<PlannerSchema>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("plan")) {
        database.createObjectStore("plan", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("days")) {
        database.createObjectStore("days", { keyPath: "date" });
      }
      if (!database.objectStoreNames.contains("reminders")) {
        database.createObjectStore("reminders", { keyPath: "id" });
      }
    },
  });
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

export async function getPlan(): Promise<SavedPlan | null> {
  return withDb(async (db) => (await db.get("plan", "current")) ?? null);
}

export async function savePlan(plan: SavedPlan, options?: { resetProgress?: boolean }): Promise<SavedPlan> {
  const stored = toStoredPlan(plan);
  await withDb(async (db) => {
    await db.put("plan", stored);
    if (options?.resetProgress) {
      await db.clear("days");
    }
  });
  return stored;
}

export async function clearPlan(): Promise<void> {
  await withDb(async (db) => {
    await db.delete("plan", "current");
    await db.clear("days");
  });
}

export async function getDayLog(date: string): Promise<DayLog> {
  return withDb(async (db) => (await db.get("days", date)) ?? { date, checkedStepIds: [] });
}

export async function saveDayLog(log: DayLog): Promise<void> {
  await withDb(async (db) => {
    await db.put("days", { date: log.date, checkedStepIds: [...log.checkedStepIds] });
  });
}

export async function listCompletedDates(steps: PlanStep[]): Promise<string[]> {
  if (steps.length === 0) return [];
  return withDb(async (db) => {
    const days = await db.getAll("days");
    return days
      .filter((day) => steps.every((step) => day.checkedStepIds.includes(step.id)))
      .map((day) => day.date);
  });
}

export async function getSentReminderIds(): Promise<string[]> {
  return withDb(async (db) => {
    const records = await db.getAll("reminders");
    return records.map((record) => record.id);
  });
}

export async function claimReminder(id: string, sentAt = new Date().toISOString()): Promise<boolean> {
  return withDb(async (db) => {
    const tx = db.transaction("reminders", "readwrite");
    const existing = await tx.store.get(id);
    if (existing) {
      await tx.done;
      return false;
    }
    await tx.store.put({ id, sentAt });
    await tx.done;
    return true;
  });
}
