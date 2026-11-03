import type { ScanRecord } from './types';

export interface ScoreInput {
  learningPercent: number;
  scans: ScanRecord[];
  openProblems: number;
}

export interface ScorePart {
  label: string;
  value: number;
  weight: number;
  description: string;
}

export interface SecurityScore {
  score: number;
  parts: ScorePart[];
}

export function computeSecurityScore({ learningPercent, scans, openProblems }: ScoreInput): SecurityScore {
  const safeChecks = scans.filter((scan) => scan.verdict === 'safe').length;
  const checkHealth = scans.length === 0 ? 60 : Math.round((100 * safeChecks) / scans.length);
  const problemHealth = Math.max(0, 100 - 20 * openProblems);

  const parts: ScorePart[] = [
    {
      label: 'Learning',
      value: learningPercent,
      weight: 0.3,
      description: 'Share of lessons and scenarios you have completed.',
    },
    {
      label: 'Open problems',
      value: problemHealth,
      weight: 0.3,
      description: 'Drops by 20 points for each unresolved problem.',
    },
    {
      label: 'Recent checks',
      value: checkHealth,
      weight: 0.4,
      description: 'Share of your recent checks that found no warning signs. Neutral until you run a check.',
    },
  ];

  const score = Math.round(parts.reduce((total, part) => total + part.value * part.weight, 0));
  return { score, parts };
}
