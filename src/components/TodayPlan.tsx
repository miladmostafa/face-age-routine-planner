import { formatWhen, weekdayNarrow } from "../lib/dates";
import { isRescanDue } from "../lib/reminders";
import { recentDateKeys } from "../lib/streaks";
import {
  COSMETIC_DISCLAIMER,
  DEFAULT_EVENING_TIME,
  DEFAULT_MORNING_TIME,
  DEFAULT_RESCAN_WEEKS,
  type Period,
  type PlanStep,
  type SavedPlan,
} from "../lib/types";

type TodayPlanProps = {
  plan: SavedPlan | null;
  capturedSteps: PlanStep[];
  today: string;
  checks: string[];
  completedDates: string[];
  streak: number;
  morningTime: string;
  eveningTime: string;
  rescanWeeks: number;
  useSampleCatalog: boolean;
  permission: NotificationPermission | "unsupported" | "unknown";
  notice: string | null;
  onToggle: (stepId: string) => void;
  onSaveCaptured: () => void;
  onSaveSample: () => void;
  onExport: () => void;
  onClear: () => void;
  onMorningTime: (value: string) => void;
  onEveningTime: (value: string) => void;
  onRescanWeeks: (value: number) => void;
  onSampleCatalog: (value: boolean) => void;
  onScrollToScanner: () => void;
};

function StepList({
  title,
  hint,
  steps,
  checks,
  onToggle,
}: {
  title: string;
  hint: string;
  steps: PlanStep[];
  checks: string[];
  onToggle: (stepId: string) => void;
}) {
  return (
    <fieldset className="period">
      <legend>{title}</legend>
      <p className="period-hint">{hint}</p>
      {steps.length === 0 ? <p className="empty-inline">No steps in this part of the plan.</p> : null}
      <ul className="steps">
        {steps.map((step) => {
          const checked = checks.includes(step.id);
          return (
            <li key={step.id}>
              <label className={checked ? "step is-done" : "step"}>
                <input type="checkbox" checked={checked} onChange={() => onToggle(step.id)} />
                <span>
                  {step.groupTitle !== step.productName ? <span className="step-kicker">{step.groupTitle}</span> : null}
                  <span className="step-name">{step.productName}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

function preview(steps: PlanStep[], period: Period): string {
  const names = steps.filter((step) => step.period === period).map((step) => step.productName);
  return names.length > 0 ? names.join(", ") : "None yet";
}

export function TodayPlan(props: TodayPlanProps) {
  const {
    plan,
    capturedSteps,
    today,
    checks,
    completedDates,
    streak,
    morningTime,
    eveningTime,
    rescanWeeks,
    useSampleCatalog,
    permission,
    notice,
    onToggle,
    onSaveCaptured,
    onSaveSample,
    onExport,
    onClear,
    onMorningTime,
    onEveningTime,
    onRescanWeeks,
    onSampleCatalog,
    onScrollToScanner,
  } = props;
  const done = new Set(completedDates);
  const days = recentDateKeys(today, 7);
  const checkedCount = plan ? plan.steps.filter((step) => checks.includes(step.id)).length : 0;
  const rescanDue = plan ? isRescanDue(plan, new Date()) : false;

  return (
    <section className="panel plan-panel" id="today" aria-labelledby="plan-heading">
      <div className="panel-head">
        <p className="eyebrow">Daily checklist</p>
        <h2 id="plan-heading">Save the routine and tick it off</h2>
      </div>

      {rescanDue && plan ? (
        <div className="callout" role="status">
          <p>
            <strong>Time to rescan.</strong> This plan was saved {formatWhen(plan.savedAt)}. Run a new Face Age scan and
            save the updated cosmetic routine.
          </p>
          <button type="button" className="button" onClick={onScrollToScanner}>
            Go to scanner
          </button>
        </div>
      ) : null}

      {capturedSteps.length > 0 ? (
        <div className="capture-card">
          <h3>Routine ready to save</h3>
          <p>
            <strong>Morning:</strong> {preview(capturedSteps, "morning")}
          </p>
          <p>
            <strong>Evening:</strong> {preview(capturedSteps, "evening")}
          </p>
          <button type="button" className="button" onClick={onSaveCaptured}>
            Save as my plan
          </button>
        </div>
      ) : (
        <p className="lede">
          Finish a scan and open the routine inside the widget. The save button appears when Face Age displays a
          routine.
        </p>
      )}

      <div className="settings">
        <label>
          Morning reminder
          <input type="time" value={morningTime || DEFAULT_MORNING_TIME} onChange={(event) => onMorningTime(event.target.value)} />
        </label>
        <label>
          Evening reminder
          <input type="time" value={eveningTime || DEFAULT_EVENING_TIME} onChange={(event) => onEveningTime(event.target.value)} />
        </label>
        <label>
          Rescan after (weeks)
          <input
            type="number"
            min={1}
            max={52}
            value={rescanWeeks || DEFAULT_RESCAN_WEEKS}
            onChange={(event) => onRescanWeeks(Number(event.target.value))}
          />
        </label>
      </div>

      <label className="check-row">
        <input
          type="checkbox"
          checked={useSampleCatalog}
          onChange={(event) => onSampleCatalog(event.target.checked)}
        />
        <span>Load sample cosmetic products into Face Age after a scan</span>
      </label>

      {plan ? (
        <>
          <div className="streak-row">
            <div>
              <p className="streak-count">{streak}</p>
              <p className="streak-label">day streak</p>
            </div>
            <div>
              <p className="progress-count">
                {checkedCount} of {plan.steps.length} steps today
              </p>
              <p className="fine-print">A day counts when every step is checked. Saved {formatWhen(plan.savedAt)}.</p>
            </div>
          </div>
          <ol className="week" aria-label="Last seven days">
            {days.map((day) => (
              <li key={day} className={done.has(day) ? "is-complete" : ""}>
                <span>{weekdayNarrow(day)}</span>
                <span className="week-mark" aria-hidden="true" />
                <span className="sr-only">{done.has(day) ? "complete" : "not complete"}</span>
              </li>
            ))}
          </ol>
          <StepList
            title="Morning"
            hint={`Reminder at ${plan.morningTime}.`}
            steps={plan.steps.filter((step) => step.period === "morning")}
            checks={checks}
            onToggle={onToggle}
          />
          <StepList
            title="Evening"
            hint={`Reminder at ${plan.eveningTime}.`}
            steps={plan.steps.filter((step) => step.period === "evening")}
            checks={checks}
            onToggle={onToggle}
          />
          <div className="button-row">
            <button type="button" className="button" onClick={onExport}>
              Export calendar (.ics)
            </button>
            <button type="button" className="button button-ghost" onClick={onClear}>
              Clear plan
            </button>
          </div>
        </>
      ) : (
        <div className="empty-plan">
          <p>No plan is saved on this device yet.</p>
          <button type="button" className="button button-ghost" onClick={onSaveSample}>
            Save sample routine
          </button>
          <p className="fine-print">
            The sample routine uses the same checklist builder as a live scan: cleanser, serum, moisturizer, morning
            SPF, and an evening cream. A later scan replaces it.
          </p>
        </div>
      )}

      {notice ? <p className="form-note">{notice}</p> : null}
      {permission === "denied" ? (
        <p className="form-note">Notifications are blocked. Allow them in the browser to get morning and evening reminders.</p>
      ) : null}
      {permission === "unsupported" ? (
        <p className="form-note">This browser does not support local notifications. Calendar export still works.</p>
      ) : null}
      <p className="fine-print">{COSMETIC_DISCLAIMER}</p>
    </section>
  );
}
