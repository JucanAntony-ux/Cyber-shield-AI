import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Checklist from '../components/Checklist';
import { SituationText, StatusBadge, TopicBadge, UrgencyBadge } from '../components/Badges';
import GuidanceNotice from '../components/GuidanceNotice';
import LoadState from '../components/LoadState';
import NotesPanel from '../components/NotesPanel';
import Paragraphs from '../components/Paragraphs';
import { useAsync } from '../hooks/useAsync';
import {
  deleteProblem,
  fetchGuide,
  fetchProblem,
  fetchProblemSteps,
  fetchResources,
  setProblemStatus,
  setStepCompleted,
} from '../lib/api';
import { topicLabel } from '../lib/topics';
import type { Lesson, Problem, ProblemStatus, ProblemStep, Resource } from '../lib/types';

interface ProblemView {
  problem: Problem;
  steps: ProblemStep[];
  guide: Lesson | null;
  resources: Resource[];
}

const STATUS_OPTIONS: { id: ProblemStatus; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'resolved', label: 'Resolved' },
];

export default function ProblemDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const detail = useAsync(async (): Promise<ProblemView | null> => {
    const problem = await fetchProblem(id);
    if (!problem) return null;
    const [steps, guide, resources] = await Promise.all([
      fetchProblemSteps(problem.id),
      fetchGuide(problem.topic),
      fetchResources(),
    ]);
    return {
      problem,
      steps,
      guide,
      resources: resources.filter((resource) => resource.topic === null || resource.topic === problem.topic),
    };
  }, [id]);

  const [view, setView] = useState<ProblemView | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (detail.data) setView(detail.data);
  }, [detail.data]);

  if (!view) {
    if (detail.error) {
      return (
        <section className="page-section">
          <LoadState loading={false} error onRetry={detail.reload} />
        </section>
      );
    }
    if (detail.data === null && !detail.loading) {
      return (
        <section className="page-section">
          <h1 className="page-title">Problem not found</h1>
          <p className="page-lead">
            This problem may have been deleted. <Link to="/">Return to the dashboard</Link>.
          </p>
        </section>
      );
    }
    return (
      <p className="muted" role="status">
        Loading...
      </p>
    );
  }

  const { problem, steps, guide, resources } = view;
  const completedSteps = steps.filter((step) => step.completed).length;
  const percent = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;
  const isUrgent = problem.urgency === 'high' || problem.situation === 'active-incident';

  async function handleStepToggle(stepId: string, completed: boolean) {
    setActionError(null);
    setView((prev) =>
      prev
        ? { ...prev, steps: prev.steps.map((step) => (step.id === stepId ? { ...step, completed } : step)) }
        : prev,
    );
    try {
      await setStepCompleted(stepId, completed);
    } catch (err) {
      console.error(err);
      setActionError('That step could not be saved. Please try again.');
      setView((prev) =>
        prev
          ? { ...prev, steps: prev.steps.map((step) => (step.id === stepId ? { ...step, completed: !completed } : step)) }
          : prev,
      );
    }
  }

  async function handleStatusChange(status: ProblemStatus) {
    setActionError(null);
    const previous = problem.status;
    setView((prev) => (prev ? { ...prev, problem: { ...prev.problem, status } } : prev));
    try {
      await setProblemStatus(problem.id, status);
    } catch (err) {
      console.error(err);
      setActionError('The status could not be updated. Please try again.');
      setView((prev) => (prev ? { ...prev, problem: { ...prev.problem, status: previous } } : prev));
    }
  }

  async function handleDelete() {
    setActionError(null);
    try {
      await deleteProblem(problem.id);
      navigate('/');
    } catch (err) {
      console.error(err);
      setActionError('This problem could not be deleted. Please try again.');
      setConfirmingDelete(false);
    }
  }

  return (
    <section className="page-section">
      <Link to="/" className="small-text">
        Back to dashboard
      </Link>
      <h1 className="page-title" style={{ marginTop: 'var(--s1)' }}>
        {problem.title}
      </h1>
      <div className="badge-row" style={{ marginBottom: 'var(--s3)' }}>
        <TopicBadge topic={problem.topic} />
        <StatusBadge status={problem.status} />
        <UrgencyBadge urgency={problem.urgency} />
        <SituationText situation={problem.situation} />
      </div>

      {isUrgent && (
        <div className="notice warning emergency" role="alert" style={{ marginBottom: 'var(--s3)' }}>
          <p>
            <strong>Act now if someone may be in your accounts or money is at risk.</strong> Contact your bank, your IT
            or security team, or local authorities. Then work through the checklist below.
          </p>
        </div>
      )}

      {actionError && (
        <div className="notice error" role="alert" style={{ marginBottom: 'var(--s3)' }}>
          <p>{actionError}</p>
        </div>
      )}

      <div className="two-col">
        <div className="stack">
          <section className="card" aria-labelledby="explanation-heading">
            <h2 id="explanation-heading">What this is about</h2>
            {guide ? (
              <>
                <p className="muted">{guide.summary}</p>
                <Paragraphs text={guide.body} />
                {guide.deeper_dive && (
                  <details>
                    <summary>Deeper explanation for experienced users</summary>
                    <Paragraphs text={guide.deeper_dive} />
                  </details>
                )}
              </>
            ) : (
              <p className="muted">Guidance for {topicLabel(problem.topic)} is not available yet.</p>
            )}
          </section>

          <section className="card" aria-labelledby="checklist-heading">
            <div className="section-head">
              <h2 id="checklist-heading">Your checklist</h2>
              <span className="progress-label">
                {completedSteps} of {steps.length} steps complete
              </span>
            </div>
            <div className="progress-track" aria-hidden="true" style={{ marginBottom: 'var(--s2)' }}>
              <div className="progress-fill" style={{ width: `${percent}%` }} />
            </div>
            {steps.length === 0 ? (
              <p className="muted">This problem has no steps yet.</p>
            ) : (
              <Checklist
                items={steps.map((step) => ({ id: step.id, text: step.text, completed: step.completed }))}
                onToggle={handleStepToggle}
              />
            )}
            <p className="hint" style={{ marginTop: 'var(--s2)' }}>
              Work through the steps in order when you can. Tick each one once it is done.
            </p>
          </section>

          <NotesPanel scope="problem" id={problem.id} />
        </div>

        <aside className="stack">
          <section className="card" aria-labelledby="status-heading">
            <h2 id="status-heading">Progress</h2>
            <div className="field">
              <label htmlFor="problem-status">Status</label>
              <select
                id="problem-status"
                value={problem.status}
                onChange={(event) => handleStatusChange(event.target.value as ProblemStatus)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="card" aria-labelledby="description-heading">
            <h2 id="description-heading">What you described</h2>
            <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{problem.description}</p>
          </section>

          <section className="card" aria-labelledby="resources-heading">
            <h2 id="resources-heading">Useful resources</h2>
            {resources.length === 0 ? (
              <p className="muted">No saved resources for this topic yet.</p>
            ) : (
              <ul className="list">
                {resources.map((resource) => (
                  <li key={resource.id}>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      {resource.title}
                    </a>
                    {resource.description && <p className="muted small-text">{resource.description}</p>}
                  </li>
                ))}
              </ul>
            )}
            <p style={{ marginTop: 'var(--s2)', marginBottom: 0 }}>
              <Link to="/resources">Manage saved resources</Link>
            </p>
          </section>

          <GuidanceNotice />

          <section className="card" aria-labelledby="delete-heading">
            <h2 id="delete-heading">Remove this problem</h2>
            {confirmingDelete ? (
              <div className="button-row">
                <button type="button" className="btn danger" onClick={handleDelete}>
                  Yes, delete it
                </button>
                <button type="button" className="btn secondary" onClick={() => setConfirmingDelete(false)}>
                  Keep it
                </button>
              </div>
            ) : (
              <button type="button" className="btn danger" onClick={() => setConfirmingDelete(true)}>
                Delete this problem
              </button>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
