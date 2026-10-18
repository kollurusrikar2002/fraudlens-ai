import type { DeskId } from "./components/RoleSwitch";

export interface Account {
  username: string;
  password: string;
  desk: DeskId;
  label: string;
}

export const accounts: Account[] = [
  { username: "admin", password: "admin", desk: "admin", label: "Admin" },
  { username: "banking", password: "banking", desk: "banking", label: "Banking" },
  { username: "finance", password: "finance", desk: "finance", label: "Finance" },
  { username: "insurance", password: "insurance", desk: "insurance", label: "Insurance" },
  { username: "compliance", password: "compliance", desk: "compliance", label: "Compliance" },
];

export interface Session {
  username: string;
  desk: DeskId;
  label: string;
}

const KEY = "finproof-session";

export function readSession(): Session | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed.username || !parsed.desk) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function signIn(username: string, password: string): Session | null {
  const found = accounts.find(
    (account) => account.username === username.trim().toLowerCase() && account.password === password,
  );
  if (!found) return null;
  const session = { username: found.username, desk: found.desk, label: found.label };
  sessionStorage.setItem(KEY, JSON.stringify(session));
  return session;
}

export function signOut() {
  sessionStorage.removeItem(KEY);
}
