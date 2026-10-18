import { useState, type FormEvent } from "react";
import { accounts, signIn } from "../accounts";

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const session = signIn(username, password);
    if (!session) {
      setError("That username or password does not match a desk.");
      return;
    }
    onSuccess();
  }

  return (
    <main className="login">
      <section className="login-copy">
        <span className="brand-seal" aria-hidden="true" />
        <h1>FinProof</h1>
        <p>Sign in to the desk your role is allowed to see. Admin opens all 16 files. Each other role opens only its own book.</p>
      </section>
      <form className="login-card" onSubmit={submit}>
        <p className="eyebrow">Sign in</p>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="review" type="submit">Enter the desk</button>
        <ul className="login-accounts">
          {accounts.map((account) => (
            <li key={account.username}>
              <button
                type="button"
                onClick={() => {
                  setUsername(account.username);
                  setPassword(account.password);
                  setError("");
                }}
              >
                <strong>{account.label}</strong>
                <span>{account.username} / {account.password}</span>
              </button>
            </li>
          ))}
        </ul>
      </form>
    </main>
  );
}
