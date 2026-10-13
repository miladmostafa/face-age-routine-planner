import { claimReminder, getSentReminderIds } from "./db";
import { dueReminders } from "./reminders";
import type { SavedPlan } from "./types";

const SYNC_TAG = "routine-reminders";

type PeriodicSyncRegistration = ServiceWorkerRegistration & {
  periodicSync?: {
    register: (tag: string, options: { minInterval: number }) => Promise<void>;
  };
};

export async function registerReminderWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export async function requestReminderPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!("Notification" in window)) return "unsupported";
  return Notification.requestPermission();
}

export async function enablePeriodicSync(registration: ServiceWorkerRegistration): Promise<void> {
  const periodic = (registration as PeriodicSyncRegistration).periodicSync;
  if (!periodic) return;
  try {
    await periodic.register(SYNC_TAG, { minInterval: 12 * 60 * 60 * 1000 });
  } catch {
    // Periodic background sync is optional. The open page still delivers reminders.
  }
}

export async function deliverDueReminders(plan: SavedPlan): Promise<number> {
  if (!("Notification" in window) || Notification.permission !== "granted") return 0;
  if (!("serviceWorker" in navigator)) return 0;
  const registration = await navigator.serviceWorker.ready;
  const sent = await getSentReminderIds();
  const due = dueReminders(plan, new Date(), sent);
  let shown = 0;
  for (const reminder of due) {
    const claimed = await claimReminder(reminder.id);
    if (!claimed) continue;
    await registration.showNotification(reminder.title, {
      body: reminder.body,
      tag: reminder.id,
      icon: "/icon-192.png",
      data: { url: "/#today" },
    });
    shown += 1;
  }
  return shown;
}

export function startReminderLoop(getPlan: () => SavedPlan | null): () => void {
  let timer = 0;
  const tick = async () => {
    const plan = getPlan();
    if (plan) {
      try {
        await deliverDueReminders(plan);
      } catch {
        // A failed notification check should not break the checklist.
      }
    }
  };
  void tick();
  timer = window.setInterval(() => {
    void tick();
  }, 30_000);
  const onVisible = () => {
    if (document.visibilityState === "visible") void tick();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
