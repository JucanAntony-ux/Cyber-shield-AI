import { Link } from 'react-router-dom';
import Generator from '../components/passwords/Generator';
import ReuseCheck from '../components/passwords/ReuseCheck';
import StrengthCheck from '../components/passwords/StrengthCheck';

const TIPS = [
  'Use a unique password for every account.',
  'Prefer long passphrases of four or more unrelated words.',
  'Turn on two-step verification for email and banking first.',
  'Store passwords in a reputable password manager, not in notes or browser text files.',
  'Change a password immediately if a service you use reports a breach.',
];

export default function Passwords() {
  return (
    <section className="page-section">
      <div className="page-intro">
        <h1 className="page-title">Password security</h1>
        <p className="page-lead">
          Check how strong a password is, spot reused passwords, and generate new ones. Nothing you type here is
          saved or sent to a server.
        </p>
      </div>

      <div className="stack section">
        <StrengthCheck />
        <Generator />
        <ReuseCheck />

        <section className="card" aria-labelledby="tips-heading">
          <h2 id="tips-heading">Password recommendations</h2>
          <ul className="bullet-list">
            {TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <p className="muted small-text">
            Want to learn more? <Link to="/library">Open the password safety lessons in the library.</Link>
          </p>
        </section>
      </div>
    </section>
  );
}
