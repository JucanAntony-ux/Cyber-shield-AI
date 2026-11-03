import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GuidanceNotice from '../components/GuidanceNotice';
import { createProblem, fetchGuide } from '../lib/api';
import { reviewSubmission } from '../lib/safety';
import { SITUATIONS, TOPICS } from '../lib/topics';
import type { Topic, Urgency } from '../lib/types';

type SafetyIssue = 'harmful' | 'sensitive';

interface FormErrors {
  title?: string;
  description?: string;
  topic?: string;
}

const URGENCY_OPTIONS: { id: Urgency; title: string; text: string }[] = [
  { id: 'low', title: 'Low', text: 'I am curious or planning ahead.' },
  { id: 'medium', title: 'Medium', text: 'I should deal with this soon.' },
  { id: 'high', title: 'High', text: 'This may be happening right now.' },
];

const SAFETY_MESSAGES: Record<SafetyIssue, string> = {
  harmful:
    'CyberShield AI can only help you defend systems, protect your own accounts, and learn safely. It cannot help you get into systems or accounts that are not yours, take other people\'s information, or build attack tools. If you are worried about your own accounts or devices, describe that instead, or explore the library for defensive steps.',
  sensitive:
    'Your description seems to include a password, secret key, card number, or ID number. Please remove it and describe the problem in general terms. Never share real passwords or secrets, with this app or anyone else.',
};

export default function NewProblem() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState<Topic | ''>('');
  const [situation, setSituation] = useState<string>(SITUATIONS[0].id);
  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [errors, setErrors] = useState<FormErrors>({});
  const [safetyIssue, setSafetyIssue] = useState<SafetyIssue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const isUrgent = urgency === 'high' || situation === 'active-incident';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(false);

    const nextErrors: FormErrors = {};
    if (!title.trim()) nextErrors.title = 'Give the problem a short title.';
    if (!description.trim()) nextErrors.description = 'Describe what is happening in your own words.';
    if (!topic) nextErrors.topic = 'Choose the topic that fits best.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !topic) return;

    const review = reviewSubmission(`${title}\n${description}`);
    if (review !== 'ok') {
      setSafetyIssue(review);
      return;
    }
    setSafetyIssue(null);

    setSubmitting(true);
    try {
      const guide = await fetchGuide(topic);
      if (!guide || guide.checklist.length === 0) {
        throw new Error('No checklist is available for this topic.');
      }
      const problem = await createProblem(
        { title: title.trim(), description: description.trim(), topic, situation, urgency },
        guide.checklist,
      );
      navigate(`/problems/${problem.id}`);
    } catch (err) {
      console.error(err);
      setSubmitError(true);
      setSubmitting(false);
    }
  }

  return (
    <section className="page-section">
      <h1 className="page-title">Describe a security problem</h1>
      <p className="page-lead">
        Answer a few questions in your own words. You will get an explanation and a checklist you can work through at
        your pace.
      </p>

      <div className="notice info" style={{ marginBottom: 'var(--s3)' }}>
        <p>
          <strong>Keep it general.</strong> Do not include passwords, secret keys, card or ID numbers, or private
          details about you or your organization.
        </p>
      </div>

      {isUrgent && (
        <div className="notice warning emergency" role="alert" style={{ marginBottom: 'var(--s3)' }}>
          <p>
            <strong>If someone may be using your accounts or money right now,</strong> contact your bank, your IT or
            security team, or local authorities immediately. The checklist is a starting point, not a replacement for
            urgent help.
          </p>
        </div>
      )}

      {safetyIssue && (
        <div className="notice error" role="alert" style={{ marginBottom: 'var(--s3)' }}>
          <p>{SAFETY_MESSAGES[safetyIssue]}</p>
          {safetyIssue === 'harmful' && (
            <p style={{ marginBottom: 0 }}>
              <Link to="/library">Open the library</Link>
            </p>
          )}
        </div>
      )}

      <form className="form" onSubmit={handleSubmit} noValidate>
        <fieldset className="fieldset">
          <legend>1. What is going on?</legend>
          <div className="field">
            <label htmlFor="problem-title">Short title</label>
            <input
              id="problem-title"
              type="text"
              maxLength={200}
              value={title}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'problem-title-error' : undefined}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="For example: Unexpected email asking me to confirm a payment"
            />
            {errors.title && (
              <p id="problem-title-error" className="error-text">
                {errors.title}
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="problem-description">Describe it in your own words</label>
            <textarea
              id="problem-description"
              maxLength={5000}
              value={description}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'problem-description-error' : 'problem-description-hint'}
              onChange={(event) => setDescription(event.target.value)}
            />
            <p id="problem-description-hint" className="hint">
              Mention what you noticed, when it started, and what you have already done.
            </p>
            {errors.description && (
              <p id="problem-description-error" className="error-text">
                {errors.description}
              </p>
            )}
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend>2. Which topic fits best?</legend>
          <div className="choice-grid">
            {TOPICS.map((item) => (
              <label key={item.id} className="choice">
                <input
                  type="radio"
                  name="topic"
                  value={item.id}
                  checked={topic === item.id}
                  onChange={() => setTopic(item.id)}
                />
                <span className="choice-title">{item.label}</span>
                <span className="choice-text">{item.blurb}</span>
              </label>
            ))}
          </div>
          {errors.topic && <p className="error-text">{errors.topic}</p>}
        </fieldset>

        <fieldset className="fieldset">
          <legend>3. Which best describes your situation?</legend>
          <div className="choice-grid">
            {SITUATIONS.map((item) => (
              <label key={item.id} className="choice">
                <input
                  type="radio"
                  name="situation"
                  value={item.id}
                  checked={situation === item.id}
                  onChange={() => setSituation(item.id)}
                />
                <span className="choice-title">{item.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend>4. How urgent does it feel?</legend>
          <div className="choice-grid">
            {URGENCY_OPTIONS.map((item) => (
              <label key={item.id} className="choice">
                <input
                  type="radio"
                  name="urgency"
                  value={item.id}
                  checked={urgency === item.id}
                  onChange={() => setUrgency(item.id)}
                />
                <span className="choice-title">{item.title}</span>
                <span className="choice-text">{item.text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="button-row">
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Building your checklist...' : 'Get my explanation and checklist'}
          </button>
          <Link to="/" className="btn secondary">
            Cancel
          </Link>
          {submitError && (
            <p className="error-text" role="alert">
              We could not save this problem. Check your connection and try again.
            </p>
          )}
        </div>
      </form>

      <div className="section">
        <GuidanceNotice />
      </div>
    </section>
  );
}
