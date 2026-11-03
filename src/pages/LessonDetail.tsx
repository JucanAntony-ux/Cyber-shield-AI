import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Checklist from '../components/Checklist';
import { TopicBadge } from '../components/Badges';
import LoadState from '../components/LoadState';
import NotesPanel from '../components/NotesPanel';
import Paragraphs from '../components/Paragraphs';
import Quiz from '../components/Quiz';
import { useAsync } from '../hooks/useAsync';
import {
  fetchLesson,
  fetchLessonProgress,
  fetchQuizQuestions,
  saveQuizResult,
} from '../lib/api';
import { DIFFICULTY_LABELS, KIND_LABELS } from '../lib/topics';
import type { Lesson, LessonProgress, QuizQuestion } from '../lib/types';

interface LessonData {
  lesson: Lesson;
  questions: QuizQuestion[];
  progress: LessonProgress | null;
}

function LessonChecklist({ items }: { items: string[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  return (
    <Checklist
      items={items.map((text, index) => ({ id: String(index), text, completed: Boolean(done[index]) }))}
      onToggle={(id, completed) => setDone((prev) => ({ ...prev, [id]: completed }))}
    />
  );
}

export default function LessonDetail() {
  const { slug = '' } = useParams();
  const lessonState = useAsync(async (): Promise<LessonData | null> => {
    const lesson = await fetchLesson(slug);
    if (!lesson) return null;
    const [questions, progress] = await Promise.all([fetchQuizQuestions(lesson.id), fetchLessonProgress()]);
    return {
      lesson,
      questions,
      progress: progress.find((item) => item.lesson_id === lesson.id) ?? null,
    };
  }, [slug]);

  const data = lessonState.data;

  if (!data) {
    if (lessonState.error) {
      return (
        <section className="page-section">
          <LoadState loading={false} error onRetry={lessonState.reload} />
        </section>
      );
    }
    if (lessonState.loading) {
      return (
        <p className="muted" role="status">
          Loading...
        </p>
      );
    }
    return (
      <section className="page-section">
        <h1 className="page-title">Lesson not found</h1>
        <p className="page-lead">
          <Link to="/library">Return to the library</Link>.
        </p>
      </section>
    );
  }

  const { lesson, questions, progress } = data;

  async function handleQuizFinish(score: number, total: number) {
    await saveQuizResult(lesson.id, score, total);
    lessonState.reload();
  }

  return (
    <section className="page-section">
      <Link to="/library" className="small-text">
        Back to library
      </Link>
      <h1 className="page-title" style={{ marginTop: 'var(--s1)' }}>
        {lesson.title}
      </h1>
      <div className="badge-row" style={{ marginBottom: 'var(--s2)' }}>
        <span className="badge neutral">{KIND_LABELS[lesson.kind]}</span>
        <TopicBadge topic={lesson.topic} />
        <span className="badge neutral">{DIFFICULTY_LABELS[lesson.difficulty]}</span>
        {progress?.completed && <span className="badge completed">Completed</span>}
      </div>
      <p className="page-lead" style={{ marginBottom: 'var(--s3)' }}>
        {lesson.summary}
      </p>

      <div className="two-col">
        <div className="stack">
          <section className="card" aria-labelledby="body-heading">
            <h2 id="body-heading">{lesson.kind === 'scenario' ? 'The story' : 'Read'}</h2>
            <Paragraphs text={lesson.body} />
            {lesson.deeper_dive && (
              <details>
                <summary>Deeper explanation for experienced users</summary>
                <Paragraphs text={lesson.deeper_dive} />
              </details>
            )}
          </section>

          {lesson.checklist.length > 0 && (
            <section className="card" aria-labelledby="checklist-heading">
              <h2 id="checklist-heading">Checklist</h2>
              <LessonChecklist items={lesson.checklist} />
            </section>
          )}

          {questions.length > 0 && (
            <section className="card" aria-labelledby="quiz-heading">
              <h2 id="quiz-heading">Check your understanding</h2>
              <p className="hint">Answer each question, then check your score. Explanations appear after you check.</p>
              <Quiz key={lesson.id} questions={questions} onFinish={handleQuizFinish} />
            </section>
          )}

          <NotesPanel scope="lesson" id={lesson.id} />
        </div>

        <aside className="stack">
          <section className="card" aria-labelledby="progress-heading">
            <h2 id="progress-heading">Your progress</h2>
            {progress ? (
              <p className="muted" style={{ marginBottom: 0 }}>
                Latest quiz score: {progress.quiz_score} of {progress.quiz_total}.{' '}
                {progress.completed ? 'This lesson is complete.' : 'Retake the quiz to complete this lesson.'}
              </p>
            ) : (
              <p className="muted" style={{ marginBottom: 0 }}>
                You have not taken this quiz yet.
              </p>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
