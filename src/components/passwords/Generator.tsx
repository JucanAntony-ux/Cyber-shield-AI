import { useState } from 'react';
import { generatePassword, type GeneratorOptions } from '../../lib/passwordTools';

const OPTION_LABELS: { key: keyof GeneratorOptions; label: string }[] = [
  { key: 'uppercase', label: 'Uppercase letters' },
  { key: 'lowercase', label: 'Lowercase letters' },
  { key: 'digits', label: 'Numbers' },
  { key: 'symbols', label: 'Symbols' },
];

export default function Generator() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState<GeneratorOptions>({
    uppercase: true,
    lowercase: true,
    digits: true,
    symbols: true,
  });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState<'copied' | 'failed' | null>(null);
  const anySelected = Object.values(options).some(Boolean);

  function handleGenerate() {
    setPassword(generatePassword(length, options));
    setCopied(null);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied('copied');
    } catch {
      setCopied('failed');
    }
  }

  return (
    <section className="card" aria-labelledby="generator-heading">
      <h2 id="generator-heading">Password generator</h2>
      <p className="hint">Creates random passwords in your browser. Copy it into a password manager before you leave this page.</p>

      <div className="field">
        <label htmlFor="generator-length">Length: {length} characters</label>
        <input
          id="generator-length"
          type="range"
          min={8}
          max={64}
          value={length}
          onChange={(event) => setLength(Number(event.target.value))}
        />
      </div>

      <fieldset className="checkbox-group">
        <legend>Include</legend>
        {OPTION_LABELS.map((option) => (
          <label key={option.key} className="checkbox-option">
            <input
              type="checkbox"
              checked={options[option.key]}
              onChange={(event) => setOptions((prev) => ({ ...prev, [option.key]: event.target.checked }))}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <div className="button-row">
        <button type="button" className="btn primary" onClick={handleGenerate} disabled={!anySelected}>
          Generate password
        </button>
        {!anySelected && <span className="muted small-text">Choose at least one character type.</span>}
      </div>

      {password && (
        <div className="generated" aria-live="polite">
          <code className="mono-block">{password}</code>
          <div className="button-row">
            <button type="button" className="btn secondary small" onClick={handleCopy}>
              Copy
            </button>
            {copied === 'copied' && <span className="success-text">Copied to clipboard.</span>}
            {copied === 'failed' && (
              <span className="error-text">Copy is not available here. Select the password and copy it manually.</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
