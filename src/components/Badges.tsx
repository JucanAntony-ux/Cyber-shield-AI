import { SITUATION_LABELS, topicLabel } from '../lib/topics';
import type { ProblemStatus, Topic, Urgency } from '../lib/types';

const STATUS_LABELS: Record<ProblemStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

const URGENCY_LABELS: Record<Urgency, string> = {
  low: 'Low urgency',
  medium: 'Medium urgency',
  high: 'High urgency',
};

export function TopicBadge({ topic }: { topic: Topic }) {
  return <span className="badge topic">{topicLabel(topic)}</span>;
}

export function StatusBadge({ status }: { status: ProblemStatus }) {
  return <span className={`badge status-${status}`}>{STATUS_LABELS[status]}</span>;
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return <span className={`badge urgency-${urgency}`}>{URGENCY_LABELS[urgency]}</span>;
}

export function SituationText({ situation }: { situation: string }) {
  return <span className="badge neutral">{SITUATION_LABELS[situation] ?? 'Situation not listed'}</span>;
}
