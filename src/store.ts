import fs from "fs";
import path from "path";
import type { FinCase } from "./types.ts";

export interface DeskEvent {
  at: string;
  reference: string;
  party: string;
  recommendation: string;
}

interface Store {
  created: FinCase[];
  events: DeskEvent[];
}

const file = path.join(process.cwd(), "data", "desk.json");

function read(): Store {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Store;
    return {
      created: Array.isArray(parsed.created) ? parsed.created : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return { created: [], events: [] };
  }
}

function write(store: Store) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(store, null, 2));
}

export function readCreated(): FinCase[] {
  return read().created;
}

export function saveCreated(created: FinCase[]) {
  const store = read();
  store.created = created;
  write(store);
}

export function readEvents(): DeskEvent[] {
  return read().events;
}

export function pushEvent(event: DeskEvent) {
  const store = read();
  store.events.unshift(event);
  store.events = store.events.slice(0, 40);
  write(store);
}
