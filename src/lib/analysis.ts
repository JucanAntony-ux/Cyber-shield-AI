import type { AnalysisResult, Finding, Verdict } from './types';

export interface Check {
  weight: number;
  finding: Finding;
}

export const VERDICT_LABELS: Record<Verdict, string> = {
  safe: 'Safe',
  suspicious: 'Suspicious',
  dangerous: 'Potentially dangerous',
};

const SUMMARIES: Record<Verdict, string> = {
  safe: 'No common warning signs were found. This does not prove the item is safe.',
  suspicious: 'Some warning signs were found. Verify it through a trusted channel before you act on it.',
  dangerous: 'Several strong warning signs were found. Do not interact with it until it is verified.',
};

const SEVERITY_ORDER: Record<Finding['severity'], number> = { danger: 0, warning: 1, info: 2 };

export function verdictFromScore(score: number): Verdict {
  if (score >= 60) return 'dangerous';
  if (score >= 25) return 'suspicious';
  return 'safe';
}

export function buildResult(checks: Check[]): AnalysisResult {
  const score = Math.min(100, checks.reduce((sum, check) => sum + check.weight, 0));
  const verdict = verdictFromScore(score);
  const findings: Finding[] =
    checks.length > 0
      ? [...checks]
          .sort((a, b) => SEVERITY_ORDER[a.finding.severity] - SEVERITY_ORDER[b.finding.severity])
          .map((check) => check.finding)
      : [{ severity: 'info', text: 'No common warning signs were found.' }];
  return { verdict, score, summary: SUMMARIES[verdict], findings };
}
