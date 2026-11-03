/*
# Add CyberShield scan history and known-hash list

1. New Tables
- `scan_results`: one row per completed check (URL, email, file, or password check). Stores the verdict, a 0 to 100 risk score, a short summary, and a list of findings. It stores only a short subject, such as a website host name or a file name, never full links, email bodies, passwords, or file contents.
- `known_file_hashes`: a read-only list of SHA-256 fingerprints of known-bad or test files, with a label and a note.

2. Seed data
- Adds the standard antivirus test file fingerprint as a harmless test entry, so the file checker can be demonstrated safely.

3. Security
- Row level security is enabled on both tables.
- `scan_results` allows reading and adding rows for the anon and authenticated roles. There is no update or delete access, so history is append-only.
- `known_file_hashes` is read-only for the browser.
- The app has no sign-in, so this history is shared by everyone using the app. Do not put private information into the subject or summary fields.

4. Important notes
- Verdicts and kinds are restricted to known values by check constraints.
- The hash column must be a 64-character hexadecimal SHA-256 value.
*/

CREATE TABLE IF NOT EXISTS scan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('url', 'email', 'file', 'password')),
  subject text NOT NULL CHECK (length(subject) BETWEEN 1 AND 200),
  verdict text NOT NULL CHECK (verdict IN ('safe', 'suspicious', 'dangerous')),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  summary text NOT NULL CHECK (length(summary) BETWEEN 1 AND 500),
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scan_results_created_idx ON scan_results (created_at DESC);

CREATE TABLE IF NOT EXISTS known_file_hashes (
  sha256 text PRIMARY KEY CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  label text NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('suspicious', 'dangerous')),
  note text NOT NULL
);

ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE known_file_hashes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON scan_results TO anon, authenticated;
GRANT SELECT ON known_file_hashes TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_scan_results" ON scan_results;
CREATE POLICY "anon_select_scan_results" ON scan_results FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_scan_results" ON scan_results;
CREATE POLICY "anon_insert_scan_results" ON scan_results FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_known_file_hashes" ON known_file_hashes;
CREATE POLICY "anon_select_known_file_hashes" ON known_file_hashes FOR SELECT
  TO anon, authenticated USING (true);

INSERT INTO known_file_hashes (sha256, label, verdict, note) VALUES
('275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f',
 'EICAR standard antivirus test file',
 'suspicious',
 'A harmless test string that antivirus products recognize on purpose. It is not malware, but real scanners flag it, so it is used to test detection.')
ON CONFLICT (sha256) DO NOTHING;
