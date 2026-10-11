export function readClientId(value: string | undefined = import.meta.env.VITE_FACEAGE_CLIENT_ID): string {
  return typeof value === "string" ? value.trim() : "";
}
