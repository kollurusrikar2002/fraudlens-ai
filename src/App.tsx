import { useEffect, useMemo, useState } from "react";
import { readSession, signOut, type Session } from "./accounts";
import { cases, sectors } from "./corpus";
import { loadCreated, saveCreated } from "./created";
import { CaseDesk } from "./components/CaseDesk";
import { Customers } from "./components/Customers";
import { Dashboard } from "./components/Dashboard";
import { Inbox } from "./components/Inbox";
import { Ledger } from "./components/Ledger";
import { Login } from "./components/Login";
import { NewFile } from "./components/NewFile";
import { deskById } from "./components/RoleSwitch";
import type { FinCase, RunResult, Sector } from "./types";

type Screen = "home" | "queue" | "customers" | "create" | "ledger";

export function App() {
  const [session, setSession] = useState<Session | null>(() => readSession());
  const [sector, setSector] = useState<Sector | "All">("All");
  const [search, setSearch] = useState("");
  const [screen, setScreen] = useState<Screen>("home");
  const [origin, setOrigin] = useState<Screen>("home");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [runs, setRuns] = useState<Record<string, RunResult>>({});
  const [created, setCreated] = useState<FinCase[]>(() => loadCreated());

  useEffect(() => {
    fetch("/api/created")
      .then((response) => response.json())
      .then((saved: FinCase[]) => {
        if (!Array.isArray(saved)) return;
        if (saved.length) {
          setCreated(saved);
          saveCreated(saved);
          return;
        }
        const local = loadCreated();
        if (!local.length) return;
        Promise.all(local.map((item) => fetch("/api/created", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        }))).catch(() => undefined);
      })
      .catch(() => undefined);
  }, []);

  if (!session) {
    return (
      <div className="shell">
        <Login onSuccess={() => setSession(readSession())} />
      </div>
    );
  }

  return (
    <Desk
      session={session}
      sector={sector}
      setSector={setSector}
      search={search}
      setSearch={setSearch}
      screen={screen}
      setScreen={setScreen}
      origin={origin}
      setOrigin={setOrigin}
      activeId={activeId}
      setActiveId={setActiveId}
      runs={runs}
      setRuns={setRuns}
      created={created}
      onCreate={(item) => {
        const saved: FinCase = {
          ...item,
          checks: item.checks.map((check, index) =>
            index === 0 ? { ...check, pass: item.recommendation === "Approve" } : check,
          ),
        };
        const next = [...created, saved];
        setCreated(next);
        saveCreated(next);
        fetch("/api/created", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saved),
        }).catch(() => undefined);
        setScreen("home");
        setActiveId(saved.id);
      }}
      onSignOut={() => {
        signOut();
        setSession(null);
        setActiveId(null);
        setScreen("home");
        setSearch("");
      }}
    />
  );
}

function Desk({
  session,
  sector,
  setSector,
  search,
  setSearch,
  screen,
  setScreen,
  origin,
  setOrigin,
  activeId,
  setActiveId,
  runs,
  setRuns,
  created,
  onCreate,
  onSignOut,
}: {
  session: Session;
  sector: Sector | "All";
  setSector: (sector: Sector | "All") => void;
  search: string;
  setSearch: (value: string) => void;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  origin: Screen;
  setOrigin: (screen: Screen) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  runs: Record<string, RunResult>;
  setRuns: (value: Record<string, RunResult> | ((current: Record<string, RunResult>) => Record<string, RunResult>)) => void;
  created: FinCase[];
  onCreate: (item: FinCase) => void;
  onSignOut: () => void;
}) {
  const desk = deskById(session.desk);
  const all = useMemo(() => [...cases, ...created], [created]);
  const book = useMemo(
    () => (desk.sector === "All" ? all : all.filter((item) => item.sector === desk.sector)),
    [all, desk.sector],
  );
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return book.filter((item) => {
      const sectorOk = desk.sector !== "All" || sector === "All" || item.sector === sector;
      const text = `${item.party} ${item.reference} ${item.workflow} ${item.summary}`.toLowerCase();
      return sectorOk && (!needle || text.includes(needle));
    });
  }, [book, desk.sector, sector, search]);
  const active = all.find((item) => item.id === activeId) ?? null;
  const allowedSectors = desk.sector === "All" ? sectors : sectors.filter((item) => item === desk.sector);
  const backLabel = origin === "customers" ? "Customers" : origin === "ledger" ? "Transactions" : origin === "queue" ? "Queue" : "Dashboard";
  function openFile(id: string, from: Screen) {
    setOrigin(from);
    setActiveId(id);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <button className="brand" onClick={() => { setActiveId(null); setScreen("home"); }}>
          <span className="brand-seal" aria-hidden="true" />
          <div>
            <strong>FinProof</strong>
            <span>{session.label} desk</span>
          </div>
        </button>
        <nav className="topnav">
          <button className={screen === "home" && !active ? "on" : ""} onClick={() => { setActiveId(null); setScreen("home"); }}>
            Dashboard
          </button>
          <button className={screen === "queue" && !active ? "on" : ""} onClick={() => { setActiveId(null); setScreen("queue"); }}>
            Queue
          </button>
          <button className={screen === "customers" && !active ? "on" : ""} onClick={() => { setActiveId(null); setScreen("customers"); }}>
            Customers
          </button>
          <button className={screen === "ledger" && !active ? "on" : ""} onClick={() => { setActiveId(null); setScreen("ledger"); }}>
            Transactions
          </button>
          {session.desk === "admin" ? (
            <button className={screen === "create" && !active ? "on" : ""} onClick={() => { setActiveId(null); setScreen("create"); }}>
              New file
            </button>
          ) : null}
        </nav>
        <div className="signed">
          <span>Signed in</span>
          <strong>{session.username}</strong>
          <button onClick={onSignOut}>Sign out</button>
        </div>
      </header>

      {active ? (
        <CaseDesk
          kase={active}
          book={book}
          result={runs[active.id]}
          onBack={() => setActiveId(null)}
          backLabel={backLabel}
          onResult={(result) => setRuns((current) => ({ ...current, [result.caseId]: result }))}
        />
      ) : screen === "customers" ? (
        <Customers rows={book} onOpen={(id) => openFile(id, "customers")} />
      ) : screen === "ledger" ? (
        <Ledger rows={book} onOpen={(id) => openFile(id, "ledger")} />
      ) : screen === "create" && session.desk === "admin" ? (
        <NewFile onCancel={() => setScreen("home")} onSave={onCreate} />
      ) : screen === "queue" ? (
        <Inbox
          rows={visible}
          runs={runs}
          sector={desk.sector === "All" ? sector : desk.sector}
          search={search}
          onSector={setSector}
          onSearch={setSearch}
          onOpen={(id) => openFile(id, "queue")}
          sectors={allowedSectors}
        />
      ) : (
        <Dashboard
          desk={desk}
          rows={book}
          runs={runs}
          onOpen={(id) => openFile(id, "home")}
          onQueue={(next) => {
            if (desk.sector === "All") setSector(next);
            setScreen("queue");
          }}
        />
      )}
    </div>
  );
}
