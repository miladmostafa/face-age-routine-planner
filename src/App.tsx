import { useEffect, useMemo, useRef, useState } from "react";
import { FaceAgeScanner, type RoutineCapture } from "./components/FaceAgeScanner";
import { TodayPlan } from "./components/TodayPlan";
import { buildCalendar, downloadCalendar } from "./lib/calendar";
import { readClientId } from "./lib/clientId";
import { localDateKey } from "./lib/dates";
import { clearPlan, getDayLog, getPlan, listCompletedDates, saveDayLog, savePlan } from "./lib/db";
import {
  deliverDueReminders,
  enablePeriodicSync,
  registerReminderWorker,
  requestReminderPermission,
  startReminderLoop,
} from "./lib/notifications";
import { clampRescanWeeks } from "./lib/plan";
import { buildPlanSteps } from "./lib/routine";
import { FALLBACK_ROUTINE_GROUPS, ROUTINE_SUPPORT, SAMPLE_PRODUCTS } from "./lib/sampleCatalog";
import { computeStreak } from "./lib/streaks";
import {
  COSMETIC_DISCLAIMER,
  DEFAULT_EVENING_TIME,
  DEFAULT_MORNING_TIME,
  DEFAULT_RESCAN_WEEKS,
  type PlanStep,
  type RoutineGroupInfo,
  type SavedPlan,
} from "./lib/types";

export function App() {
  const clientId = readClientId();
  const today = localDateKey(new Date());
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [checks, setChecks] = useState<string[]>([]);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [capture, setCapture] = useState<RoutineCapture | null>(null);
  const [groups, setGroups] = useState<RoutineGroupInfo[]>(FALLBACK_ROUTINE_GROUPS);
  const [morningTime, setMorningTime] = useState(DEFAULT_MORNING_TIME);
  const [eveningTime, setEveningTime] = useState(DEFAULT_EVENING_TIME);
  const [rescanWeeks, setRescanWeeks] = useState(DEFAULT_RESCAN_WEEKS);
  const [useSampleCatalog, setUseSampleCatalog] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported" | "unknown">("unknown");
  const [notice, setNotice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [remindersOn, setRemindersOn] = useState(false);
  const planRef = useRef<SavedPlan | null>(null);
  planRef.current = plan;

  const capturedSteps = useMemo(
    () =>
      buildPlanSteps({
        products: capture?.products ?? [],
        groups: capture?.groups ?? groups,
        routinesSupport: ROUTINE_SUPPORT,
        showEmptyRoutines: false,
      }),
    [capture, groups],
  );

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      const stored = await getPlan();
      if (cancelled) return;
      if (stored) {
        setPlan(stored);
        setMorningTime(stored.morningTime);
        setEveningTime(stored.eveningTime);
        setRescanWeeks(stored.rescanWeeks);
        const day = await getDayLog(today);
        const relevant = day.checkedStepIds.filter((id) => stored.steps.some((step) => step.id === id));
        setChecks(relevant);
        setCompletedDates(await listCompletedDates(stored.steps));
      }
      if (typeof Notification !== "undefined") {
        setPermission(Notification.permission);
        if (Notification.permission === "granted") setRemindersOn(true);
      } else {
        setPermission("unsupported");
      }
      setLoaded(true);
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [today]);

  useEffect(() => {
    if (!remindersOn) return;
    let stop = () => {};
    void registerReminderWorker().then((registration) => {
      if (registration) void enablePeriodicSync(registration);
      stop = startReminderLoop(() => planRef.current);
    });
    return () => stop();
  }, [remindersOn]);

  async function persistSettings(next: Pick<SavedPlan, "morningTime" | "eveningTime" | "rescanWeeks">) {
    if (!plan) return;
    const updated = await savePlan({ ...plan, ...next });
    setPlan(updated);
  }

  async function storeRoutine(steps: PlanStep[]) {
    if (steps.length === 0) {
      setNotice("There are no routine steps to save yet.");
      return;
    }
    const permissionPromise = requestReminderPermission();
    const saved = await savePlan(
      {
        id: "current",
        savedAt: new Date().toISOString(),
        morningTime,
        eveningTime,
        rescanWeeks: clampRescanWeeks(rescanWeeks),
        steps,
      },
      { resetProgress: true },
    );
    setPlan(saved);
    setChecks([]);
    setCompletedDates([]);
    const result = await permissionPromise;
    setPermission(result);
    if (result === "granted") {
      setRemindersOn(true);
      const registration = await registerReminderWorker();
      if (registration) await enablePeriodicSync(registration);
      await deliverDueReminders(saved);
      setNotice("Plan saved. Reminders are on for morning, evening, and your rescan date.");
    } else if (result === "denied") {
      setNotice("Plan saved. Reminders stay off until notification permission is allowed.");
    } else if (result === "unsupported") {
      setNotice("Plan saved. This browser cannot show local notifications, so use the calendar export.");
    } else {
      setNotice("Plan saved. Allow notifications if you want morning and evening reminders.");
    }
  }

  async function toggleStep(stepId: string) {
    if (!plan) return;
    const next = checks.includes(stepId) ? checks.filter((id) => id !== stepId) : [...checks, stepId];
    setChecks(next);
    await saveDayLog({ date: today, checkedStepIds: next });
    setCompletedDates(await listCompletedDates(plan.steps));
  }

  function exportCalendar() {
    if (!plan) return;
    try {
      downloadCalendar("skincare-routine.ics", buildCalendar(plan));
      setNotice("Calendar file downloaded. Import the .ics file into Google Calendar or another calendar app.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not export the calendar.";
      setNotice(message);
    }
  }

  async function removePlan() {
    await clearPlan();
    setPlan(null);
    setChecks([]);
    setCompletedDates([]);
    setNotice("Saved plan removed from this device.");
  }

  const streak = computeStreak(completedDates, today);

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#today">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <rect width="32" height="32" rx="8" fill="#0e6b5c" />
              <path d="M8 16.5 13.2 22 24 10" fill="none" stroke="#f6f1e8" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
          <span>
            <strong>Routine Planner</strong>
            <small>Morning and evening skincare checklist</small>
          </span>
        </a>
        <nav>
          <a href="#scanner">Scanner</a>
          <a href="#today">Today</a>
          <a href="#privacy">Privacy</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">Face Age routine planner and reminders</p>
          <h1>Turn a Face Age routine into a daily checklist</h1>
          <p className="hero-copy">
            Scan with Face Age, save the morning and evening steps, tick them off, keep a streak, and export the plan
            to your calendar. Only routine and product names stay on this device.
          </p>
          <img src="https://static.getfaceage.com/logo.png" alt="Face Age" className="partner-logo" />
        </section>

        {!clientId ? (
          <section className="panel setup-banner" aria-labelledby="setup-heading">
            <h2 id="setup-heading">Add a Face Age Client ID to start</h2>
            <p>
              This planner does not ship with a Client ID. Create one in the Face Age panel, then set{" "}
              <code>VITE_FACEAGE_CLIENT_ID</code> in <code>.env.local</code> and restart the dev server.
            </p>
            <p>
              <a href="https://panel.getfaceage.com/" target="_blank" rel="noreferrer">
                Get a Client ID at panel.getfaceage.com
              </a>
            </p>
          </section>
        ) : null}

        <div className="layout">
          <div id="scanner">
            {clientId ? (
              <FaceAgeScanner
                clientId={clientId}
                useSampleCatalog={useSampleCatalog}
                onCapture={setCapture}
                onGroups={setGroups}
              />
            ) : (
              <section className="panel scanner-panel">
                <h2>Scanner waiting for a Client ID</h2>
                <p className="lede">The Face Age widget stays hidden until a Client ID is configured.</p>
              </section>
            )}
          </div>
          {loaded ? (
            <TodayPlan
              plan={plan}
              capturedSteps={capturedSteps}
              today={today}
              checks={checks}
              completedDates={completedDates}
              streak={streak}
              morningTime={morningTime}
              eveningTime={eveningTime}
              rescanWeeks={rescanWeeks}
              useSampleCatalog={useSampleCatalog}
              permission={permission}
              notice={notice}
              onToggle={(stepId) => void toggleStep(stepId)}
              onSaveCaptured={() => void storeRoutine(capturedSteps)}
              onSaveSample={() =>
                void storeRoutine(
                  buildPlanSteps({
                    products: SAMPLE_PRODUCTS,
                    groups,
                    routinesSupport: ROUTINE_SUPPORT,
                    showEmptyRoutines: false,
                  }),
                )
              }
              onExport={exportCalendar}
              onClear={() => void removePlan()}
              onMorningTime={(value) => {
                setMorningTime(value);
                void persistSettings({ morningTime: value, eveningTime, rescanWeeks });
              }}
              onEveningTime={(value) => {
                setEveningTime(value);
                void persistSettings({ morningTime, eveningTime: value, rescanWeeks });
              }}
              onRescanWeeks={(value) => {
                const next = clampRescanWeeks(value);
                setRescanWeeks(next);
                void persistSettings({ morningTime, eveningTime, rescanWeeks: next });
              }}
              onSampleCatalog={setUseSampleCatalog}
              onScrollToScanner={() => document.getElementById("scanner")?.scrollIntoView({ behavior: "smooth" })}
            />
          ) : (
            <section className="panel">
              <p>Loading your saved plan…</p>
            </section>
          )}
        </div>

        <section className="info-grid" id="privacy">
          <article>
            <h2>Privacy</h2>
            <p>
              IndexedDB on this device stores routine names, product names, checkmarks, and reminder times. It does not
              store photos. Face Age analyzes photos in the Face Age cloud.
            </p>
            <p>{COSMETIC_DISCLAIMER}</p>
          </article>
          <article id="faq">
            <h2>FAQ</h2>
            <h3>When do reminders fire?</h3>
            <p>
              Morning defaults to 8:00 and evening to 21:00. While this page is open, a service worker shows a local
              notification. A rescan reminder arrives after the number of weeks you choose, four by default.
            </p>
            <h3>How do I add this to Google Calendar?</h3>
            <p>Export the .ics file and import it into Google Calendar. Morning and evening events repeat daily.</p>
          </article>
        </section>
      </main>

      <footer className="site-footer">
        <p>
          Built with the{" "}
          <a href="https://www.npmjs.com/package/face-age" target="_blank" rel="noreferrer">
            face-age
          </a>{" "}
          widget. Skin analysis by{" "}
          <a href="https://getfaceage.com/" target="_blank" rel="noreferrer">
            Face Age
          </a>
          .
        </p>
        <p>MIT License. Cosmetic suggestions only.</p>
      </footer>
    </>
  );
}
