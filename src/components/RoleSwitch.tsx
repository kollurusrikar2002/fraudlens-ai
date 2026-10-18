import { useEffect, useRef, useState } from "react";
import type { Sector } from "../types";

export type DeskId = "admin" | "banking" | "finance" | "insurance" | "compliance";

export interface Desk {
  id: DeskId;
  label: string;
  sector: Sector | "All";
  scope: string;
}

export const desks: Desk[] = [
  { id: "admin", label: "Admin", sector: "All", scope: "All 16 files, every book" },
  { id: "banking", label: "Banking", sector: "Banking", scope: "KYC, loans, fraud, and support" },
  { id: "finance", label: "Finance", sector: "Financial services", scope: "Invoices, fees, statements, and breaks" },
  { id: "insurance", label: "Insurance", sector: "Insurance", scope: "Claims, underwriting, and policy questions" },
  { id: "compliance", label: "Compliance", sector: "Cross-cutting", scope: "Scripts, audits, and contracts" },
];

export function deskById(id: DeskId): Desk {
  return desks.find((desk) => desk.id === id) ?? desks[0];
}

export function RoleSwitch({ value, onChange }: { value: DeskId; onChange: (id: DeskId) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = deskById(value);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="role" ref={box}>
      <button className="role-btn" aria-expanded={open} onClick={() => setOpen((next) => !next)}>
        <span>Role</span>
        <strong>{current.label}</strong>
      </button>
      {open ? (
        <ul className="role-menu" role="listbox">
          {desks.map((desk) => (
            <li key={desk.id}>
              <button
                role="option"
                aria-selected={desk.id === value}
                className={desk.id === value ? "role-on" : ""}
                onClick={() => {
                  onChange(desk.id);
                  setOpen(false);
                }}
              >
                <strong>{desk.label}</strong>
                <small>{desk.scope}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
