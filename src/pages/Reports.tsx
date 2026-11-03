import { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { fetchScans } from '../lib/api';
import { VERDICT_LABELS } from '../lib/analysis';
import { buildTextReport, countByVerdict, downloadTextFile, KIND_NAMES } from '../lib/report';
import type { ScanKind, ScanRecord } from '../lib/types';
import LoadState from '../components/LoadState';

type Period = 'day' | 'all';

const KINDS: ScanKind[] = ['url', 'email', 'file'];
const DAY_MS = 24 * 60 * 60 * 1000;

export default function Reports() {
  const scans = useAsync(fetchScans, []);
  const [period, setPeriod] = useState<Period>('day');
  const [kind, setKind] = useState<ScanKind | 'all'>('all');

  const all = scans.data ?? [];
  const cutoff = Date.now() - DAY_MS;
  const inPeriod = period === 'day' ? all.filter((scan) => new Date(scan.created_at).getTime() >= cutoff) : all;
  const filtered: ScanRecord[] = kind === 'all' ? inPeriod : inPeriod.filter((scan) => scan.kind === kind);
  const counts = countByVerdict(filtered);
  const filenameDate = new Date().toISOString().slice(0, 10);

  function handleDownload() {
    downloadTextFile(`cybershield-report-${filenameDate}.txt`, buildTextReport(filtered, new Date()));
  }

  return (
    <section className="page-section">
      <div className="header-row">
        <div>
          <h1 className="page-title">Security reports</h1>
          <p className="page-lead">
            Review your daily summary and full check history, then download or print a report.
          </p>
        </div>
        <div className="button-row no-print">
          <button type="button" className="btn secondary small" onClick={handleDownload} disabled={!scans.data}>
            Download report
          </button>
          <button type="button" className="btn primary small" onClick={() => window.print()} disabled={!scans.data}>
            Save as PDF
          </button>
        </div>
      </div>

      <LoadState loading={scans.loading} error={scans.error} onRetry={scans.reload} />

      {scans.data && (
        <>
          <div className="no-print section">
            <div className="chip-row" role="group" aria-label="Period">
              <button type="button" className={`chip ${period === 'day' ? 'active' : ''}`} onClick={() => setPeriod('day')}>
                Last 24 hours
              </button>
              <button type="button" className={`chip ${period === 'all' ? 'active' : ''}`} onClick={() => setPeriod('all')}>
                All history
              </button>
            </div>
            <div className="chip-row" role="group" aria-label="Check type" style={{ marginTop: 'var(--s2)' }}>
              <button type="button" className={`chip ${kind === 'all' ? 'active' : ''}`} onClick={() => setKind('all')}>
                All types
              </button>
              {KINDS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`chip ${kind === item ? 'active' : ''}`}
                  onClick={() => setKind(item)}
                >
                  {KIND_NAMES[item]}s
                </button>
              ))}
            </div>
          </div>

          <div className="stat-grid section">
            <div className="card">
              <div className="stat-value">{filtered.length}</div>
              <div className="stat-label">Checks in view</div>
            </div>
            <div className="card">
              <div className="stat-value">{counts.safe}</div>
              <div className="stat-label">{VERDICT_LABELS.safe}</div>
            </div>
            <div className="card">
              <div className="stat-value">{counts.suspicious}</div>
              <div className="stat-label">{VERDICT_LABELS.suspicious}</div>
            </div>
            <div className="card">
              <div className="stat-value">{counts.dangerous}</div>
              <div className="stat-label">{VERDICT_LABELS.dangerous}</div>
            </div>
          </div>

          <section className="card section" aria-labelledby="history-heading">
            <h2 id="history-heading">Check history</h2>
            {filtered.length === 0 ? (
              <p className="muted">No checks in this view yet. Run a link, message, or file check to build your history.</p>
            ) : (
              <ul className="list">
                {filtered.map((scan) => (
                  <li key={scan.id} className="list-item report-item">
                    <div className="list-item-main">
                      <span className="small-text">{scan.subject}</span>
                      <span className="muted small-text">{scan.summary}</span>
                      <div className="badge-row">
                        <span className={`badge verdict-badge verdict-${scan.verdict}`}>{VERDICT_LABELS[scan.verdict]}</span>
                        <span className="muted small-text">
                          {KIND_NAMES[scan.kind]} · score {scan.score}
                        </span>
                      </div>
                    </div>
                    <span className="muted small-text">{new Date(scan.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  );
}
