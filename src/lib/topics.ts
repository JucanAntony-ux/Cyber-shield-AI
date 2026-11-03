import type { Difficulty, LessonKind, Topic } from './types';

export interface TopicInfo {
  id: Topic;
  label: string;
  blurb: string;
}

export const TOPICS: TopicInfo[] = [
  {
    id: 'account-security',
    label: 'Account security',
    blurb: 'Passwords, two-step verification, and recovering accounts after something looks wrong.',
  },
  {
    id: 'phishing',
    label: 'Phishing and scams',
    blurb: 'Suspicious emails, texts, calls, and links that try to rush you into acting.',
  },
  {
    id: 'network-safety',
    label: 'Network safety',
    blurb: 'Home or office Wi-Fi, router settings, and devices you do not recognize.',
  },
  {
    id: 'secure-coding',
    label: 'Secure coding',
    blurb: 'Reviewing software for common weaknesses before they reach users.',
  },
  {
    id: 'incident-response',
    label: 'Incident response',
    blurb: 'Calm, ordered steps for the first hours after you suspect a security incident.',
  },
];

export function topicLabel(topic: Topic): string {
  return TOPICS.find((item) => item.id === topic)?.label ?? topic;
}

export const KIND_LABELS: Record<LessonKind, string> = {
  guide: 'Guide',
  lesson: 'Lesson',
  scenario: 'Scenario',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const SITUATIONS = [
  { id: 'guidance', label: 'I want guidance on what to do next' },
  { id: 'suspicious-message', label: 'I received a suspicious message, call, or link' },
  { id: 'odd-behavior', label: 'An account or device is behaving strangely' },
  { id: 'possible-exposure', label: 'I think some information may have been exposed' },
  { id: 'active-incident', label: 'Something is happening right now and I need help responding' },
] as const;

export const SITUATION_LABELS: Record<string, string> = Object.fromEntries(
  SITUATIONS.map((item) => [item.id, item.label]),
);
