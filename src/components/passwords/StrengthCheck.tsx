import { useMemo, useState } from 'react';
import { assessPassword } from '../../lib/passwordTools';

const LEVEL_CLASSES = ['meter-0', 'meter-1', 'meter-2', 'meter-3', 'meter-4'];

export default function StrengthCheck() {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);
  const assessment = useMemo(() => (value ? assessPassword(value) : null), [value]);

  return (
    <section className="card" aria-labelledby="strength-heading">
      <h2 id="strength-heading">Password strength checker</h2>
      <p className="hint">
        Checked only in your browser. The password is never saved or sent anywhere.
      </p>

      <div className="field">
        <label htmlFor="strength-input">Password to check</label>
        <div className="input-with-action">
          <input
            id="strength-input"
            type={visible ? 'text' : 'password'}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <button type="button" className="btn secondary small" onClick={() => setVisible((prev) => !prev)}>
            {visible ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {assessment && (
        <div className="stack-tight" role="status">
          <div className="meter" aria-hidden="true">
            {LEVEL_CLASSES.map((cls, index) => (
              <span key={cls} className={`meter-segment ${index <= assessment.level ? `filled ${cls}` : ''}`} />
            ))}
          </div>
          <p>
            <strong>{assessment.label}</strong>
            <span className="muted"> · about {assessment.estimatedBits} bits of guessing resistance</span>
          </p>
          {assessment.issues.length > 0 && (
            <div>
              <h3>What to fix</h3>
              <ul className="bullet-list">
                {assessment.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h3>Recommendations</h3>
            <ul className="bullet-list">
              {assessment.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
