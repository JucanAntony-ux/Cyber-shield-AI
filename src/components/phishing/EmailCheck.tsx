import { useState, type FormEvent } from 'react';
import { saveScan } from '../../lib/api';
import { analyzeEmail } from '../../lib/phishingAnalysis';
import type { AnalysisResult } from '../../lib/types';
import VerdictCard from '../VerdictCard';

export default function EmailCheck() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [historyWarning, setHistoryWarning] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const check = analyzeEmail(value);
    setHistoryWarning(false);
    if (!check.ok) {
      setError(check.error);
      setResult(null);
      return;
    }
    setError(null);
    setResult(check.result);
    saveScan({ kind: 'email', subject: check.subject, ...check.result }).catch((err: unknown) => {
      console.error(err);
      setHistoryWarning(true);
    });
  }

  return (
    <div className="stack">
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email-input">Message text</label>
          <textarea
            id="email-input"
            rows={8}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Paste the body of the message here. Remove any passwords or codes first."
          />
          <p className="hint">The message is analyzed in your browser. Only a summary is saved to history, never the text.</p>
        </div>
        <div className="button-row">
          <button type="submit" className="btn primary" disabled={!value.trim()}>
            Check message
          </button>
        </div>
      </form>

      {error && (
        <div className="notice error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <>
          <VerdictCard result={result} />
          {historyWarning && (
            <div className="notice warning" role="status">
              <p>This result could not be saved to your history. It is still shown above.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
