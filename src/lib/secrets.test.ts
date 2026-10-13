import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readClientId } from "./clientId";

function files(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git" || entry === "coverage") continue;
    const path = join(dir, entry);
    if (entry === ".env.local" || entry.endsWith(".local")) continue;
    const info = statSync(path);
    if (info.isDirectory()) files(path, acc);
    else if (/\.(ts|tsx|js|mjs|md|html|json|css|svg|yml|yaml)$/.test(entry) || entry === ".env.example") {
      acc.push(path);
    }
  }
  return acc;
}

describe("client id configuration", () => {
  it("trims a provided client id and treats a blank value as missing", () => {
    expect(readClientId("")).toBe("");
    expect(readClientId("   ")).toBe("");
    expect(readClientId("  abc  ")).toBe("abc");
  });

  it("does not hardcode a Face Age client id in committed source", () => {
    const offenders = files(process.cwd()).filter((path) => {
      const text = readFileSync(path, "utf8");
      return /faceageId\s*:\s*["'][^"']+["']/.test(text) || /VITE_FACEAGE_CLIENT_ID\s*=\s*["'][^"']+["']/.test(text);
    });
    expect(offenders).toEqual([]);
  });
});
