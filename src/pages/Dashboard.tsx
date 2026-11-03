import { useEffect, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { fetchLessonProgress, fetchLessons, fetchProblems, fetchScans } from '../lib/api';
import { VERDICT_LABELS } from '../lib/analysis';
import { computeSecurityScore } from '../lib/securityScore';
import { KIND_NAMES } from '../lib/report';
import { TopicBadge } from '../components/Badges';
import LoadState from '../components/LoadState';

const REFRESH_MS = 30_000;

const TOOLS = [
  { to: '/passwords', title: 'Password checker', text: 'Test strength, find reuse, generate new passwords.' },
  { to: '/phishing', title: 'Phishing scanner', text: 'Check a link or message for warning signs.' },
  { to: '/files', title: 'File checker', text: 'Fingerprint a file and look for red flags.' },
  { to: '/reports', title: 'Reports', text: 'Review history and download a report.' },
];

export default function Dashboard() {
  const dashboard = useAsync(async () => {
    const [scans, problems, lessons, progress] = await Promise.all([
      fetchScans(),
      fetchProblems(),
      fetchLessons(),
      fetchLessonProgress(),
    ]);
    const learnable = lessons.filter((lesson) => lesson.kind !== 'guide');
    const completedIds = new Set(progress.filter((item) => item.completed).map((item) => item.lesson_id));
    const learningCompleted = learnable.filter((lesson) => completedIds.has(lesson.id)).length;
    const learningPercent = learnable.length > 0 ? Math.round((learningCompleted / learnable.length) * 100) : 0;
    const nextLesson = learnable.find((lesson) => !completedIds.has(lesson.id)) ?? null;
    return {
      scans,
      openProblems: problems.filter((problem) => problem.status !== 'resolved').length,
      learningPercent,
      learningCompleted,
      learningTotal: learnable.length,
      nextLesson,
      problemsTotal: problems.length,
    };
  }, []);

  const { reload } = dashboard;
  useEffect(() => {
    const timer = window.setInterval(reload, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  const data = dashboard.data;
  const score = data
    ? computeSecurityScore({
        learningPercent: data.learningPercent,
        scans: data.scans,
        openProblems: data.openProblems,
      })
    : null;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekChecks = data?.scans.filter((scan) => new Date(scan.created_at).getTime() >= weekAgo).length ?? 0;
  const alerts = data?.scans.filter((scan) => scan.verdict !== 'safe').slice(0, 5) ?? [];
  const recent = data?.scans.slice(0, 6) ?? [];
  const status = !score ? '' : score.score >= 80 ? 'Good' : score.score >= 50 ? 'Needs attention' : 'At risk';

  return (
    <section className="page-section">
      <div className="header-row">
        <div>
          <h1 className="page-title">Security dashboard</h1>
          <p className="page-lead">Your overall status, recent checks, and anything that needs your attention.</p>
        </div>
        <button type="button" className="btn secondary no-print" onClick={reload}>
          Refresh
        </button>
      </div>

      {(dashboard.loading && !data) || dashboard.error ? (
        <LoadState loading={dashboard.loading} error={dashboard.error} onRetry={reload} />
      ) : null}

      {data && score && (
        <>
          <div className="dashboard-top section">
            <div className="card score-card">
              <div className="score-ring" style={{ '--score': `${score.score}%` } as CSSProperties}>
                <span className="score-value">{score.score}</span>
              </div>
              <div>
                <p className="eyebrow">Security score</p>
                <h2 className="score-status">{status}</h2>
                <ul className="score-parts">
                  {score.parts.map((part) => (
                    <li key={part.label} title={part.description}>
                      <span>{part.label}</span>
                      <strong>{Math.round(part.value)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="stat-grid">
              <div className="card">
                <div className="stat-value">{weekChecks}</div>
                <div className="stat-label">Checks this week</div>
              </div>
              <div className="card">
                <div className="stat-value">{alerts.length}</div>
                <div className="stat-label">Items flagged</div>
              </div>
              <div className="card">
                <div className="stat-value">{data.openProblems}</div>
                <div className="stat-label">Open problems</div>
              </div>
              <div className="card">
                <div className="stat-value">
                  {data.learningCompleted} / {data.learningTotal}
                </div>
                <div className="stat-label">Lessons completed</div>
              </div>
            </div>
          </div>

          <div className="two-col section">
            <section className="card" aria-labelledby="alerts-heading">
              <div className="section-head">
                <h2 id="alerts-heading">Live alerts</h2>
                <span className="live-indicator">Updates every 30 seconds</span>
              </div>
              {alerts.length === 0 ? (
                <p className="muted">No alerts. Items flagged as suspicious or dangerous will appear here.</p>
              ) : (
                <ul className="list">
                  {alerts.map((scan) => (
                    <li key={scan.id} className="list-item">
                      <div className="list-item-main">
                        <span className="small-text">{scan.subject}</span>
                        <div className="badge-row">
                          <span className={`badge verdict-badge verdict-${scan.verdict}`}>{VERDICT_LABELS[scan.verdict]}</span>
                          <span className="muted small-text">{KIND_NAMES[scan.kind]}</span>
                        </div>
                      </div>
                      <span className="muted small-text">{new Date(scan.created_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card" aria-labelledby="activity-heading">
              <div className="section-head">
                <h2 id="activity-heading">Recent activity</h2>
                <Link to="/reports" className="small-text">
                  Full history
                </Link>
              </div>
              {recent.length === 0 ? (
                <p className="muted">No checks yet. Run a scan to see your activity here.</p>
              ) : (
                <ul className="list">
                  {recent.map((scan) => (
                    <li key={scan.id} className="list-item">
                      <div className="list-item-main">
                        <span className="small-text">{scan.subject}</span>
                        <span className="muted small-text">
                          {KIND_NAMES[scan.kind]} · {VERDICT_LABELS[scan.verdict]}
                        </span>
                      </div>
                      <span className="muted small-text">{new Date(scan.created_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="section" aria-labelledby="tools-heading">
            <h2 id="tools-heading">Security tools</h2>
            <div className="tool-grid">
              {TOOLS.map((tool) => (
                <Link key={tool.to} to={tool.to} className="card card-link">
                  <h3>{tool.title}</h3>
                  <p className="muted small-text">{tool.text}</p>
                </Link>
              ))}
            </div>
          </section>

          <div className="two-col section">
            <section className="card" aria-labelledby="problem-heading">
              <h2 id="problem-heading">Get step-by-step help</h2>
              <p className="muted">
                {data.problemsTotal === 0
                  ? 'Describe a security problem to get a checklist tailored to it.'
                  : `You have ${data.openProblems} unresolved problem(s) with checklists waiting.`}
              </p>
              <Link to="/problems/new" className="btn primary small">
                Describe a problem
              </Link>
            </section>
            {data.nextLesson && (
              <Link to={`/library/${data.nextLesson.slug}`} className="card card-link">
                <span className="muted small-text">
                  <TopicBadge topic={data.nextLesson.topic} /> Continue learning
                </span>
                <h3>{data.nextLesson.title}</h3>
                <p className="muted small-text">{data.nextLesson.summary}</p>
              </Link>
            )}
          </div>
        </>
      )}
    </section>
  );
}
