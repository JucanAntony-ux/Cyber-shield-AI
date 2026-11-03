import { useState, type FormEvent } from 'react';
import { findReusedLines } from '../../lib/passwordTools';

const MAX_LINES = 50;

export default function ReuseCheck() {
  const [value, setValue] = useState('');
  const [groups, setGroups] = useState<number[][] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const passwords = value.split('\n').map((line) => line.trim());
    const filled = passwords.filter(Boolean);
    if (filled.length < 2) {
      setError('Enter at least two passwords, one per line, to compare them.');
      setGroups(null);
      return;
    }
    if (passwords.length > MAX_LINES) {
      setError(`Check up to ${MAX_LINES} passwords at a time.`);
      setGroups(null);
      return;
    }
    setError(null);
    setGroups(findReusedLines(passwords));
  }

  return (
    <section className="card" aria-labelledby="reuse-heading">
      <h2 id="reuse-heading">Reused password check</h2>
      <p className="hint">
        Enter one password per line. Comparison happens only in your browser, and nothing is saved.
      </p>
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="reuse-input">Passwords, one per line</label>
          <textarea id="reuse-input" value={value} onChange={(event) => setValue(event.target.value)} rows={5} spellCheck={false} />
        </div>
        <div className="button-row">
          <button type="submit" className="btn primary">
            Find reused passwords
          </button>
        </div>
      </form>

      {error && (
        <p className="error-text" role="alert" style={{ marginTop: 'var(--s2)' }}>
          {error}
        </p>
      )}
      {groups && groups.length === 0 && (
        <div className="notice success" role="status" style={{ marginTop: 'var(--s2)' }}>
          <p>No reused passwords found in this list.</p>
        </div>
      )}
      {groups && groups.length > 0 && (
        <div className="notice warning" role="status" style={{ marginTop: 'var(--s2)' }}>
          <p>Reused passwords found. Give each account its own password.</p>
          <ul className="bullet-list">
            {groups.map((lines) => (
              <li key={lines.join('-')}>Lines {lines.join(' and ')} use the same password.</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
