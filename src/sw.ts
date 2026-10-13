import { claimReminder, getPlan, getSentReminderIds } from "./lib/db";
import { dueReminders } from "./lib/reminders";

interface WorkerScope {
  skipWaiting(): Promise<void>;
  clients: {
    claim(): Promise<void>;
    matchAll(options: { type: string; includeUncontrolled: boolean }): Promise<ReadonlyArray<ClientLike>>;
    openWindow(url: string): Promise<ClientLike | null>;
  };
  registration: ServiceWorkerRegistration;
  location: Location;
  addEventListener(type: string, listener: (event: Event) => void): void;
}

interface ClientLike {
  focus(): Promise<ClientLike>;
  url: string;
}

interface WaitUntilEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface NotificationClickEvent extends WaitUntilEvent {
  notification: { close(): void };
}

const scope = self as unknown as WorkerScope;

async function deliverFromWorker(): Promise<void> {
  const plan = await getPlan();
  if (!plan) return;
  const sent = await getSentReminderIds();
  const due = dueReminders(plan, new Date(), sent);
  for (const reminder of due) {
    const claimed = await claimReminder(reminder.id);
    if (!claimed) continue;
    await scope.registration.showNotification(reminder.title, {
      body: reminder.body,
      tag: reminder.id,
      icon: "/icon-192.png",
      data: { url: "/#today" },
    });
  }
}

async function focusPlanner(): Promise<void> {
  const target = new URL("/#today", scope.location.origin).href;
  const clients = await scope.clients.matchAll({ type: "window", includeUncontrolled: true });
  const existing = clients[0];
  if (existing) {
    await existing.focus();
    return;
  }
  await scope.clients.openWindow(target);
}

scope.addEventListener("install", (event) => {
  const extendable = event as WaitUntilEvent;
  extendable.waitUntil(scope.skipWaiting());
});

scope.addEventListener("activate", (event) => {
  const extendable = event as WaitUntilEvent;
  extendable.waitUntil(scope.clients.claim());
});

scope.addEventListener("notificationclick", (event) => {
  const click = event as NotificationClickEvent;
  click.notification.close();
  click.waitUntil(focusPlanner());
});

scope.addEventListener("periodicsync", (event) => {
  const sync = event as WaitUntilEvent & { tag?: string };
  if (sync.tag !== "routine-reminders") return;
  sync.waitUntil(deliverFromWorker());
});

scope.addEventListener("message", (event) => {
  const message = event as WaitUntilEvent & { data?: { type?: string } };
  if (message.data?.type === "check-reminders") {
    message.waitUntil(deliverFromWorker());
  }
});
