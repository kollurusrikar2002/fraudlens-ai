import type { FinCase } from "./types";

const KEY = "finproof-created";

export function loadCreated(): FinCase[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as FinCase[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCreated(items: FinCase[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}
