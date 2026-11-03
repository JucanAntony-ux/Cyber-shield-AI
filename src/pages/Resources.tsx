import { useState, type FormEvent } from 'react';
import { addResource, deleteResource, fetchResources } from '../lib/api';
import { TopicBadge } from '../components/Badges';
import LoadState from '../components/LoadState';
import { useAsync } from '../hooks/useAsync';
import { TOPICS } from '../lib/topics';
import type { Topic } from '../lib/types';

interface ResourceFormErrors {
  title?: string;
  url?: string;
}

function isWebUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function Resources() {
  const resources = useAsync(fetchResources, []);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [topic, setTopic] = useState<Topic | ''>('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<ResourceFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);

    const nextErrors: ResourceFormErrors = {};
    if (!title.trim()) nextErrors.title = 'Give the resource a title.';
    if (!isWebUrl(url.trim())) nextErrors.url = 'Enter a full web address that starts with https://.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await addResource({
        title: title.trim(),
        url: url.trim(),
        topic: topic || null,
        description: description.trim() || null,
      });
      setTitle('');
      setUrl('');
      setTopic('');
      setDescription('');
      resources.reload();
    } catch (err) {
      console.error(err);
      setActionError('The resource could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setActionError(null);
    try {
      await deleteResource(id);
      resources.reload();
    } catch (err) {
      console.error(err);
      setActionError('The resource could not be removed. Please try again.');
    }
  }

  return (
    <section className="page-section">
      <h1 className="page-title">Saved resources</h1>
      <p className="page-lead">
        Keep trusted websites and guides in one place. Only save links to reputable public sources.
      </p>

      <div className="two-col section">
        <section aria-labelledby="resource-list-heading">
          <h2 id="resource-list-heading">Your list</h2>
          <LoadState loading={resources.loading} error={resources.error} onRetry={resources.reload} />
          {actionError && (
            <div className="notice error" role="alert" style={{ marginBottom: 'var(--s2)' }}>
              <p>{actionError}</p>
            </div>
          )}
          {resources.data && resources.data.length === 0 && (
            <div className="empty">
              <p>No resources saved yet. Add one using the form.</p>
            </div>
          )}
          {resources.data && resources.data.length > 0 && (
            <ul className="list">
              {resources.data.map((resource) => (
                <li key={resource.id} className="list-item">
                  <div className="list-item-main">
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      {resource.title}
                    </a>
                    {resource.description && <span className="muted small-text">{resource.description}</span>}
                    <div className="badge-row">{resource.topic && <TopicBadge topic={resource.topic} />}</div>
                  </div>
                  <button type="button" className="btn danger small" onClick={() => handleDelete(resource.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="add-resource-heading">
          <h2 id="add-resource-heading">Add a resource</h2>
          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="resource-title">Title</label>
              <input
                id="resource-title"
                type="text"
                maxLength={200}
                value={title}
                aria-invalid={Boolean(errors.title)}
                onChange={(event) => setTitle(event.target.value)}
              />
              {errors.title && <p className="error-text">{errors.title}</p>}
            </div>
            <div className="field">
              <label htmlFor="resource-url">Web address</label>
              <input
                id="resource-url"
                type="url"
                value={url}
                placeholder="https://"
                aria-invalid={Boolean(errors.url)}
                onChange={(event) => setUrl(event.target.value)}
              />
              {errors.url && <p className="error-text">{errors.url}</p>}
            </div>
            <div className="field">
              <label htmlFor="resource-topic">Topic (optional)</label>
              <select id="resource-topic" value={topic} onChange={(event) => setTopic(event.target.value as Topic | '')}>
                <option value="">Any topic</option>
                {TOPICS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="resource-description">Why it helps (optional)</label>
              <input
                id="resource-description"
                type="text"
                maxLength={300}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="button-row">
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save resource'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
}
