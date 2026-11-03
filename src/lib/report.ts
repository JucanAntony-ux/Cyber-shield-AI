import { VERDICT_LABELS } from './analysis';
import type { ScanRecord, Verdict } from './types';

export const KIND_NAMES: Record<ScanRecord['kind'], string> = {
  url: 'Link',
  email: 'Email',
  file: 'File',
  password: 'Password',
};

export function countByVerdict(scans: ScanRecord[]): Record<Verdict, number> {
  return scans.reduce<Record<Verdict, number>>(
    (counts, scan) => ({ ...counts, [scan.verdict]: counts[scan.verdict] + 1 }),
    { safe: 0, suspicious: 0, dangerous: 0 },
  );
}

export function buildTextReport(scans: ScanRecord[], generatedAt: Date): string {
  const counts = countByVerdict(scans);
  const recommendations = [
    counts.dangerous > 0 && 'Do not interact with flagged items. Report phishing messages and delete suspicious files.',
    counts.suspicious > 0 && 'Verify flagged links and messages through a separate, trusted channel.',
    'Use a password manager and two-step verification on important accounts.',
    'Keep devices and software updated.',
    scans.length === 0 && 'Run a check to start building your history.',
  ].filter((line): line is string => typeof line === 'string');

  const lines = [
    'CyberShield AI security report',
    `Generated: ${generatedAt.toLocaleString()}`,
    `Checks in report: ${scans.length}`,
    `${VERDICT_LABELS.safe}: ${counts.safe} | ${VERDICT_LABELS.suspicious}: ${counts.suspicious} | ${VERDICT_LABELS.dangerous}: ${counts.dangerous}`,
    '',
    'Recommendations',
    ...recommendations.map((line) => `- ${line}`),
    '',
    'Checks',
    ...scans.flatMap((scan) => [
      `${new Date(scan.created_at).toLocaleString()} | ${KIND_NAMES[scan.kind]} | ${VERDICT_LABELS[scan.verdict]} (${scan.score}/100) | ${scan.subject}`,
      `  ${scan.summary}`,
      ...scan.findings.map((finding) => `  - ${finding.text}`),
    ]),
    '',
    'This report is general educational guidance, not professional incident-response or legal advice.',
  ];
  return lines.join('\n');
}

export function downloadTextFile(filename: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
