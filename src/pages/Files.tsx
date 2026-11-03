import { useState, type ChangeEvent } from 'react';
import { fetchKnownHash, saveScan } from '../lib/api';
import { MAX_FILE_BYTES, SIGNATURE_LABELS, analyzeFileTraits, sha256Hex, type Signature } from '../lib/fileAnalysis';
import type { AnalysisResult } from '../lib/types';
import VerdictCard from '../components/VerdictCard';

interface FileResult {
  name: string;
  size: number;
  sha256: string;
  signature: Signature;
  knownLabel: string | null;
  analysis: AnalysisResult;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Files() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FileResult | null>(null);
  const [historyWarning, setHistoryWarning] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setResult(null);
    setHistoryWarning(false);
    if (file.size > MAX_FILE_BYTES) {
      setError('This file is larger than 25 MB. Choose a smaller file to check.');
      return;
    }
    if (file.size === 0) {
      setError('This file is empty, so there is nothing to check.');
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const sha256 = await sha256Hex(buffer);
      const known = await fetchKnownHash(sha256);
      const header = new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength));
      const { signature, result: analysis } = analyzeFileTraits({ name: file.name, size: file.size, header, known });
      setResult({
        name: file.name,
        size: file.size,
        sha256,
        signature,
        knownLabel: known?.label ?? null,
        analysis,
      });
      saveScan({ kind: 'file', subject: file.name.slice(0, 200), ...analysis }).catch((err: unknown) => {
        console.error(err);
        setHistoryWarning(true);
      });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error && err.message.startsWith('This page cannot')
          ? err.message
          : 'This file could not be checked. Try again, or choose a different file.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-section">
      <div className="page-intro">
        <h1 className="page-title">File checker</h1>
        <p className="page-lead">
          Upload a file to fingerprint it, compare it with known flagged files, and look for disguised or risky
          types. The file itself is never stored or uploaded.
        </p>
      </div>

      <div className="card section">
        <label className="file-drop" htmlFor="file-input">
          <span className="file-drop-title">{busy ? 'Checking file...' : 'Choose a file to check'}</span>
          <span className="muted small-text">Up to 25 MB. Checked in your browser.</span>
          <input id="file-input" type="file" className="visually-hidden" onChange={handleChange} disabled={busy} />
        </label>
        <p className="hint" style={{ marginTop: 'var(--s2)' }}>
          Only the file name, size, and fingerprint are saved to your history. For a full malware scan, use a trusted
          antivirus product on your device.
        </p>
      </div>

      {error && (
        <div className="notice error section" role="alert">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="stack section">
          <section className="card" aria-labelledby="file-details-heading">
            <h2 id="file-details-heading">File details</h2>
            <dl className="details-grid">
              <dt>Name</dt>
              <dd>{result.name}</dd>
              <dt>Size</dt>
              <dd>{formatSize(result.size)}</dd>
              <dt>Detected contents</dt>
              <dd>{SIGNATURE_LABELS[result.signature]}</dd>
              <dt>Known flagged file</dt>
              <dd>{result.knownLabel ?? 'No match in the known list'}</dd>
              <dt>SHA-256 fingerprint</dt>
              <dd>
                <code className="mono-block">{result.sha256}</code>
              </dd>
            </dl>
          </section>
          <VerdictCard result={result.analysis} />
          {historyWarning && (
            <div className="notice warning" role="status">
              <p>This result could not be saved to your history. It is still shown above.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
