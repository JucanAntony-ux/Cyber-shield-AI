import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DIFFICULTY_LABELS, KIND_LABELS, TOPICS, topicLabel } from '../lib/topics';
import { fetchLessonProgress, fetchLessons } from '../lib/api';
import { TopicBadge } from '../components/Badges';
import LoadState from '../components/LoadState';
import { useAsync } from '../hooks/useAsync';
import type { Lesson, LessonKind, Topic } from '../lib/types';

type KindFilter = 'all' | LessonKind;
type TopicFilter = 'all' | Topic;

const KIND_FILTERS: { id: KindFilter; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'lesson', label: 'Lessons' },
  { id: 'scenario', label: 'Scenarios' },
  { id: 'guide', label: 'Guides' },
];

function matchesQuery(lesson: Lesson, query: string): boolean {
  if (!query) return true;
  const haystack = [lesson.title, lesson.summary, topicLabel(lesson.topic), KIND_LABELS[lesson.kind]]
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export default function Library() {
  const library = useAsync(async () => {
    const [lessons, progress] = await Promise.all([fetchLessons(), fetchLessonProgress()]);
    return {
      lessons,
      completedIds: new Set(progress.filter((item) => item.completed).map((item) => item.lesson_id)),
    };
  }, []);

  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [topic, setTopic] = useState<TopicFilter>('all');

  const results = useMemo(() => {
    if (!library.data) return [];
    return library.data.lessons.filter(
      (lesson) =>
        (kind === 'all' || lesson.kind === kind) &&
        (topic === 'all' || lesson.topic === topic) &&
        matchesQuery(lesson, query),
    );
  }, [library.data, kind, topic, query]);

  return (
    <section className="page-section">
      <h1 className="page-title">Learning library</h1>
      <p className="page-lead">
        Short lessons, realistic fictional scenarios, and checklists. Search or filter to find what you need.
      </p>

      <div className="search-row section" style={{ marginTop: 'var(--s3)' }}>
        <div className="field">
          <label htmlFor="library-search">Search</label>
          <input
            id="library-search"
            type="search"
            placeholder="Try phishing, passwords, router, or incident"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div>
          <p className="field-label" id="kind-filter-label">
            Type
          </p>
          <div className="chip-row" role="group" aria-labelledby="kind-filter-label">
            {KIND_FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="chip"
                aria-pressed={kind === option.id}
                onClick={() => setKind(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="field-label" id="topic-filter-label">
            Topic
          </p>
          <div className="chip-row" role="group" aria-labelledby="topic-filter-label">
            <button type="button" className="chip" aria-pressed={topic === 'all'} onClick={() => setTopic('all')}>
              All topics
            </button>
            {TOPICS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="chip"
                aria-pressed={topic === item.id}
                onClick={() => setTopic(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <LoadState loading={library.loading} error={library.error} onRetry={library.reload} />

        {library.data && results.length === 0 && (
          <div className="empty">
            <p>No matches. Try a different word, or clear the filters.</p>
          </div>
        )}

        {library.data && results.length > 0 && (
          <>
            <p className="muted small-text" role="status">
              Showing {results.length} of {library.data.lessons.length} items
            </p>
            <div className="lesson-grid">
              {results.map((lesson) => (
                <Link key={lesson.id} to={`/library/${lesson.slug}`} className="card card-link lesson-card">
                  <div className="badge-row">
                    <span className="badge neutral">{KIND_LABELS[lesson.kind]}</span>
                    <TopicBadge topic={lesson.topic} />
                    {library.data?.completedIds.has(lesson.id) && <span className="badge completed">Completed</span>}
                  </div>
                  <h3>{lesson.title}</h3>
                  <p className="muted small-text" style={{ marginBottom: 0 }}>
                    {lesson.summary}
                  </p>
                  <span className="small-text muted">{DIFFICULTY_LABELS[lesson.difficulty]}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
