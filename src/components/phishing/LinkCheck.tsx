import { useState, type FormEvent } from 'react';
import { saveScan } from '../../lib/api';
import { analyzeLink } from '../../lib/phishingAnalysis';
import type { AnalysisResult } from '../../lib/types';
import VerdictCard from '../VerdictCard';

interface LinkResult {
  host: string;
  analysis: AnalysisResult;
}

export default function LinkCheck() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LinkResult | null>(null);
  const [historyWarning, setHistoryWarning] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const check = analyzeLink(value);
    setHistoryWarning(false);
    if (!check.ok) {
      setError(check.error);
      setResult(null);
      return;
    }
    setError(null);
    setResult({ host: check.host, analysis: check.result });
    saveScan({ kind: 'url', subject: check.host, ...check.result }).catch((err: unknown) => {
      console.error(err);
      setHistoryWarning(true);
    });
  }

  return (
    <div className="stack">
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="link-input">Web address to check</label>
          <input
            id="link-input"
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={value}
            placeholder="For example: example.com/login"
            onChange={(event) => setValue(event.target.value)}
          />
          <p className="hint">The address is analyzed in your browser. The site is never opened.</p>
        </div>
        <div className="button-row">
          <button type="submit" className="btn primary" disabled={!value.trim()}>
            Check link
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
          <p className="muted small-text">Destination name checked: {result.host}</p>
          <VerdictCard result={result.analysis} />
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
