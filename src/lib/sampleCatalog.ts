import type { RoutineGroupInfo } from "./types";

/**
 * Built-in Face Age routine groups, matching `API.getRoutineGroup()` in face-age
 * when the account has not replaced the defaults. Used only if that call returns null.
 */
export const FALLBACK_ROUTINE_GROUPS: RoutineGroupInfo[] = [
  { key: "cleanser", title: "Cleanser", status: ["morning", "night"] },
  { key: "toner", title: "Toner", status: ["morning", "night"] },
  { key: "serum", title: "Serum", status: ["morning", "night"] },
  { key: "eyeCream", title: "Eye Cream", status: ["morning", "night"] },
  { key: "spotTreatment", title: "Spot Treatment", status: ["morning", "night"] },
  { key: "moisturizer", title: "Moisturizer", status: ["morning", "night"] },
  { key: "sunscreen", title: "Sunscreen", status: ["morning"] },
  { key: "faceOil", title: "Face Oil", status: ["morning", "night"] },
  { key: "nightCream", title: "Night Cream", status: ["night"] },
];

export const ROUTINE_SUPPORT = FALLBACK_ROUTINE_GROUPS.map((group) => group.key);

export const SKIN_PROBLEMS = [
  "fineWrinkles",
  "eyeWrinkles",
  "deepWrinkles",
  "darkCircle",
  "eyeBag",
  "pores",
  "pigment",
  "redness",
  "oiliness",
  "dryness",
  "sagginess",
  "dullness",
  "acne",
] as const;

export type SampleProduct = {
  id: number;
  url: string;
  image: string;
  title: string;
  description: string;
  price: number;
  problems: string[];
  routineGroups: Record<string, string[]>;
};

/**
 * Sample cosmetic catalog passed to `API.setCustomProducts()`.
 * Image and URL fields are required by the Face Age SDK. This planner never writes them to IndexedDB.
 */
export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: 1,
    title: "Gentle Cream Cleanser",
    description: "A mild cleanser for the morning and evening.",
    url: "https://getfaceage.com/",
    image: "https://static.getfaceage.com/logo.png",
    price: 18,
    problems: ["dryness", "dullness"],
    routineGroups: { morning: ["cleanser"], night: ["cleanser"] },
  },
  {
    id: 2,
    title: "Brightening Serum",
    description: "A cosmetic serum for a more even-looking complexion.",
    url: "https://getfaceage.com/",
    image: "https://static.getfaceage.com/logo.png",
    price: 32,
    problems: ["pigment", "dullness"],
    routineGroups: { morning: ["serum"], night: ["serum"] },
  },
  {
    id: 3,
    title: "Daily Moisturizer",
    description: "A light moisturizer to seal in hydration.",
    url: "https://getfaceage.com/",
    image: "https://static.getfaceage.com/logo.png",
    price: 24,
    problems: ["dryness"],
    routineGroups: { morning: ["moisturizer"], night: ["moisturizer"] },
  },
  {
    id: 4,
    title: "Broad Spectrum SPF",
    description: "A morning sunscreen step.",
    url: "https://getfaceage.com/",
    image: "https://static.getfaceage.com/logo.png",
    price: 22,
    problems: ["pigment"],
    routineGroups: { morning: ["sunscreen"] },
  },
  {
    id: 5,
    title: "Restoring Night Cream",
    description: "A richer cream for the evening routine.",
    url: "https://getfaceage.com/",
    image: "https://static.getfaceage.com/logo.png",
    price: 28,
    problems: ["dryness", "fineWrinkles"],
    routineGroups: { night: ["nightCream"] },
  },
];
