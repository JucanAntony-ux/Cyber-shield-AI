import { useState, type FormEvent } from 'react';
import { addNote, deleteNote, fetchNotes, type NoteScope } from '../lib/api';
import type { Note } from '../lib/types';
import { useAsync } from '../hooks/useAsync';
import LoadState from './LoadState';

const MAX_NOTE_LENGTH = 5000;

interface NotesPanelProps {
  scope: NoteScope;
  id: string;
}

export default function NotesPanel({ scope, id }: NotesPanelProps) {
  const notes = useAsync(() => fetchNotes(scope, id), [scope, id]);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setSaving(true);
    setSaveError(false);
    try {
      await addNote(scope, id, trimmed);
      setBody('');
      notes.reload();
    } catch (err) {
      console.error(err);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(note: Note) {
    setDeletingId(note.id);
    try {
      await deleteNote(note.id);
      notes.reload();
    } catch (err) {
      console.error(err);
      setSaveError(true);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="card" aria-labelledby="notes-heading">
      <h2 id="notes-heading">Your notes</h2>
      <p className="hint">
        Write what you learned or what you still need to check. Do not include passwords, keys, or personal details.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor={`note-${scope}-${id}`}>New note</label>
          <textarea
            id={`note-${scope}-${id}`}
            value={body}
            maxLength={MAX_NOTE_LENGTH}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>
        <div className="button-row">
          <button type="submit" className="btn primary" disabled={saving || !body.trim()}>
            {saving ? 'Saving...' : 'Save note'}
          </button>
          {saveError && (
            <p className="error-text" role="alert">
              The note could not be saved. Please try again.
            </p>
          )}
        </div>
      </form>

      <div className="section">
        <LoadState loading={notes.loading} error={notes.error} onRetry={notes.reload} />
        {notes.data && notes.data.length === 0 && <p className="muted">No notes yet.</p>}
        {notes.data && notes.data.length > 0 && (
          <ul className="notes-list">
            {notes.data.map((note) => (
              <li key={note.id} className="note">
                <p>{note.body}</p>
                <div className="button-row">
                  <span className="muted small-text">{new Date(note.created_at).toLocaleString()}</span>
                  <button
                    type="button"
                    className="btn danger small"
                    disabled={deletingId === note.id}
                    onClick={() => handleDelete(note)}
                  >
                    Delete note
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
