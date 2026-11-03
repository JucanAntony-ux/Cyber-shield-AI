import { useState } from 'react';
import EmailCheck from '../components/phishing/EmailCheck';
import LinkCheck from '../components/phishing/LinkCheck';

type Mode = 'link' | 'email';

const MODES: { id: Mode; label: string }[] = [
  { id: 'link', label: 'Check a link' },
  { id: 'email', label: 'Check a message' },
];

const SIGNS = [
  'Urgent threats about a locked or suspended account.',
  'Requests for passwords, verification codes, or payment details.',
  'Links whose text does not match the address they lead to.',
  'Unexpected attachments or instructions to enable content.',
  'Greetings that are generic, or a sender you were not expecting to hear from.',
];

export default function Phishing() {
  const [mode, setMode] = useState<Mode>('link');

  return (
    <section className="page-section">
      <div className="page-intro">
        <h1 className="page-title">Phishing scanner</h1>
        <p className="page-lead">
          Check a suspicious link or message. You get a Safe, Suspicious, or Potentially dangerous verdict, with the
          reasons behind it.
        </p>
      </div>

      <div className="tabs section" role="tablist" aria-label="Phishing check type">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            className={`tab ${mode === item.id ? 'active' : ''}`}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="section" role="tabpanel">
        {mode === 'link' ? <LinkCheck /> : <EmailCheck />}
      </div>

      <section className="card section" aria-labelledby="signs-heading">
        <h2 id="signs-heading">Common phishing signs</h2>
        <ul className="bullet-list">
          {SIGNS.map((sign) => (
            <li key={sign}>{sign}</li>
          ))}
        </ul>
        <p className="muted small-text">
          A clean result does not guarantee safety. When in doubt, go to the official website by typing its address
          yourself.
        </p>
      </section>
    </section>
  );
}
