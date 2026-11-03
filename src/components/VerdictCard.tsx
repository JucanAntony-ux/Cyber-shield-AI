import { VERDICT_LABELS } from '../lib/analysis';
import type { AnalysisResult, Finding } from '../lib/types';

const FINDING_TAGS: Record<Finding['severity'], string> = {
  danger: 'High risk',
  warning: 'Caution',
  info: 'Note',
};

export default function VerdictCard({ result }: { result: AnalysisResult }) {
  return (
    <section className={`verdict verdict-${result.verdict}`} aria-labelledby="verdict-heading" aria-live="polite">
      <h2 id="verdict-heading" className="verdict-title">
        Result
      </h2>
      <div className="badge-row">
        <span className={`badge verdict-badge verdict-${result.verdict}`}>{VERDICT_LABELS[result.verdict]}</span>
        <span className="verdict-score">Risk score {result.score} / 100</span>
      </div>
      <p>{result.summary}</p>
      <ul className="finding-list">
        {result.findings.map((finding, index) => (
          <li key={index} className={`finding finding-${finding.severity}`}>
            <span className="finding-tag">{FINDING_TAGS[finding.severity]}</span>
            <span>{finding.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
