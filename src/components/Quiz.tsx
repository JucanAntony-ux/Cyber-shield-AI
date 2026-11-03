import { useState, type FormEvent } from 'react';
import { PASS_RATIO } from '../lib/api';
import type { QuizQuestion } from '../lib/types';

interface QuizProps {
  questions: QuizQuestion[];
  onFinish: (score: number, total: number) => Promise<void>;
}

export default function Quiz({ questions, onFinish }: QuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const allAnswered = questions.every((question) => answers[question.id] !== undefined);
  const score = questions.filter((question) => answers[question.id] === question.answer_index).length;
  const passed = questions.length > 0 && score / questions.length >= PASS_RATIO;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allAnswered) return;
    setSaving(true);
    setSaveError(false);
    try {
      await onFinish(score, questions.length);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  function handleRetry() {
    setAnswers({});
    setSubmitted(false);
    setSaveError(false);
  }

  return (
    <form className="quiz" onSubmit={handleSubmit}>
      {questions.map((question, index) => {
        const selected = answers[question.id];
        return (
          <fieldset key={question.id} className="question">
            <legend>
              {index + 1}. {question.question}
            </legend>
            {question.options.map((option, optionIndex) => {
              const isCorrect = optionIndex === question.answer_index;
              const isChosen = selected === optionIndex;
              let stateClass = '';
              if (submitted && isCorrect) stateClass = 'correct';
              else if (submitted && isChosen && !isCorrect) stateClass = 'incorrect';
              return (
                <label key={optionIndex} className={`option ${stateClass}`}>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={optionIndex}
                    checked={isChosen}
                    disabled={submitted}
                    onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
            {submitted && (
              <p className="feedback muted">
                {selected === question.answer_index ? 'Correct. ' : 'Not quite. '}
                {question.explanation}
              </p>
            )}
          </fieldset>
        );
      })}

      {!submitted && (
        <div className="button-row">
          <button type="submit" className="btn primary" disabled={!allAnswered || saving}>
            {saving ? 'Saving...' : 'Check my answers'}
          </button>
          {!allAnswered && <span className="muted small-text">Answer every question to check your score.</span>}
          {saveError && (
            <p className="error-text" role="alert">
              Your score could not be saved. Please try again.
            </p>
          )}
        </div>
      )}

      {submitted && (
        <div className={`notice ${passed ? 'success' : 'info'}`} role="status">
          <p>
            You scored {score} out of {questions.length}.{' '}
            {passed ? 'Nice work. This lesson is marked complete.' : 'Review the explanations and try again.'}
          </p>
          <button type="button" className="btn secondary small" onClick={handleRetry}>
            Try again
          </button>
        </div>
      )}
    </form>
  );
}
