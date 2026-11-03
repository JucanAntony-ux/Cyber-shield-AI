export type Topic = 'account-security' | 'phishing' | 'network-safety' | 'secure-coding' | 'incident-response';
export type LessonKind = 'guide' | 'lesson' | 'scenario';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Urgency = 'low' | 'medium' | 'high';
export type ProblemStatus = 'open' | 'in_progress' | 'resolved';

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  topic: Topic;
  kind: LessonKind;
  difficulty: Difficulty;
  summary: string;
  body: string;
  checklist: string[];
  deeper_dive: string | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  lesson_id: string;
  position: number;
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
}

export interface LessonProgress {
  lesson_id: string;
  quiz_score: number;
  quiz_total: number;
  completed: boolean;
  updated_at: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  topic: Topic;
  situation: string;
  urgency: Urgency;
  status: ProblemStatus;
  created_at: string;
  updated_at: string;
}

export interface ProblemStep {
  id: string;
  problem_id: string;
  position: number;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  problem_id: string | null;
  lesson_id: string | null;
  body: string;
  created_at: string;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  topic: Topic | null;
  description: string | null;
  created_at: string;
}

export type Verdict = 'safe' | 'suspicious' | 'dangerous';
export type ScanKind = 'url' | 'email' | 'file' | 'password';
export type FindingSeverity = 'info' | 'warning' | 'danger';

export interface Finding {
  severity: FindingSeverity;
  text: string;
}

export interface AnalysisResult {
  verdict: Verdict;
  score: number;
  summary: string;
  findings: Finding[];
}

export interface ScanRecord {
  id: string;
  kind: ScanKind;
  subject: string;
  verdict: Verdict;
  score: number;
  summary: string;
  findings: Finding[];
  created_at: string;
}

export type ScanInput = Omit<ScanRecord, 'id' | 'created_at'>;

export interface KnownFileHash {
  sha256: string;
  label: string;
  verdict: 'suspicious' | 'dangerous';
  note: string;
}
