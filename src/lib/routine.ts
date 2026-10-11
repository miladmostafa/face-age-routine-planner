import type { Period, PlanStep, RoutineGroupInfo } from "./types";

type RoutineProduct = {
  title?: unknown;
  routineGroups?: unknown;
};

export type BuildPlanInput = {
  products: unknown;
  groups: RoutineGroupInfo[] | null | undefined;
  routinesSupport?: string[];
  showEmptyRoutines?: boolean;
};

const SDK_PERIODS: Array<{ sdk: "morning" | "night"; period: Period }> = [
  { sdk: "morning", period: "morning" },
  { sdk: "night", period: "evening" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readProductName(product: RoutineProduct): string {
  if (typeof product.title !== "string") return "";
  return product.title.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
}

function productMatchesGroup(product: RoutineProduct, groupKey: string, sdkPeriod: "morning" | "night"): boolean {
  const groups = product.routineGroups;
  const key = groupKey.toLowerCase();
  if (Array.isArray(groups)) {
    return groups.some((entry) => String(entry).toLowerCase() === key);
  }
  if (isRecord(groups)) {
    const list = groups[sdkPeriod];
    return Array.isArray(list) && list.some((entry) => String(entry).toLowerCase() === key);
  }
  return false;
}

function slug(value: string): string {
  const next = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return next || "step";
}

function groupSupportsPeriod(group: RoutineGroupInfo, sdkPeriod: "morning" | "night"): boolean {
  const status = Array.isArray(group.status) ? group.status.map((entry) => String(entry).toLowerCase()) : [];
  if (status.includes(sdkPeriod)) return true;
  return sdkPeriod === "night" && status.includes("evening");
}

/**
 * Mirrors the Face Age routine tab: groups from `API.getRoutineGroup()`, products from
 * `onDisplayRoutines`, filtered by `routinesSupport`, with empty groups hidden unless requested.
 */
export function buildPlanSteps(input: BuildPlanInput): PlanStep[] {
  const products = Array.isArray(input.products)
    ? input.products.filter(isRecord).map((product) => product as RoutineProduct)
    : [];
  const groups = Array.isArray(input.groups) ? input.groups : [];
  const support = input.routinesSupport ?? [];
  const steps: PlanStep[] = [];

  for (const { sdk, period } of SDK_PERIODS) {
    for (const group of groups) {
      if (!group || typeof group.key !== "string" || typeof group.title !== "string") continue;
      if (!groupSupportsPeriod(group, sdk)) continue;
      if (support.length > 0 && !support.includes(group.key)) continue;

      const matched = products.filter((product) => productMatchesGroup(product, group.key, sdk));
      const title = group.title.trim();
      if (!title) continue;

      if (matched.length === 0) {
        if (input.showEmptyRoutines) {
          steps.push({
            id: `${period}:${group.key}`,
            period,
            groupKey: group.key,
            groupTitle: title,
            productName: title,
          });
        }
        continue;
      }

      const seen = new Set<string>();
      matched.forEach((product, index) => {
        const productName = readProductName(product);
        if (!productName) return;
        const dedupeKey = productName.toLowerCase();
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);
        steps.push({
          id: `${period}:${group.key}:${slug(productName)}:${index}`,
          period,
          groupKey: group.key,
          groupTitle: title,
          productName,
        });
      });
    }
  }

  return steps;
}

export function stepsForPeriod(steps: PlanStep[], period: Period): PlanStep[] {
  return steps.filter((step) => step.period === period);
}
