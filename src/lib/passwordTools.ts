const COMMON_PASSWORDS = new Set([
  'password', '123456', '123456789', 'qwerty', 'letmein', 'welcome', 'admin', 'iloveyou', 'monkey',
  'dragon', 'football', 'abc123', 'password1', '111111', '12345678', 'sunshine', 'master', 'princess',
  'login', 'solo', 'starwars', 'qwerty123', 'passw0rd', 'trustno1', 'superman', 'batman',
]);

const LEVEL_LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'] as const;

export interface PasswordAssessment {
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  estimatedBits: number;
  issues: string[];
  tips: string[];
}

export function assessPassword(password: string): PasswordAssessment {
  const issues: string[] = [];
  const tips: string[] = [];

  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 33;

  let bits = password.length * Math.log2(Math.max(pool, 2));

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    bits = Math.min(bits, 10);
    issues.push('This is one of the most commonly guessed passwords.');
  }
  if (/(.)\1{2,}/.test(password)) {
    bits *= 0.7;
    issues.push('Repeats the same character several times in a row.');
  }
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|qwer|asdf|zxcv)/i.test(password)) {
    bits *= 0.7;
    issues.push('Contains a simple sequence or keyboard pattern.');
  }
  if (password.length < 8) {
    issues.push('Shorter than 8 characters.');
  }
  if (password.length < 12) {
    tips.push('Use at least 12 characters. Longer passwords are much harder to guess.');
  }
  if (pool > 0 && pool <= 26) {
    issues.push('Uses only one type of character.');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    tips.push('Adding symbols increases variety, but length matters more than symbols.');
  }

  const level: PasswordAssessment['level'] = bits < 28 ? 0 : bits < 36 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
  if (level <= 2) {
    tips.push('Try a passphrase of four or more unrelated words.');
  }
  tips.push('Never reuse a password across sites. A password manager can create and store unique ones.');

  return { level, label: LEVEL_LABELS[level], estimatedBits: Math.round(bits), issues, tips };
}

export interface GeneratorOptions {
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
}

const CHARSETS: Record<keyof GeneratorOptions, string> = {
  lowercase: 'abcdefghijkmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  digits: '23456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?',
};

function randomIndex(maxExclusive: number): number {
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % maxExclusive;
}

export function generatePassword(length: number, options: GeneratorOptions): string {
  const selected = (Object.keys(CHARSETS) as (keyof GeneratorOptions)[]).filter((key) => options[key]);
  if (selected.length === 0) {
    throw new Error('Choose at least one character type.');
  }

  const pool = selected.map((key) => CHARSETS[key]).join('');
  const chars: string[] = selected.map((key) => {
    const set = CHARSETS[key];
    return set[randomIndex(set.length)];
  });
  while (chars.length < length) {
    chars.push(pool[randomIndex(pool.length)]);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export function findReusedLines(passwords: string[]): number[][] {
  const groups = new Map<string, number[]>();
  passwords.forEach((password, index) => {
    if (!password) return;
    const lineNumber = index + 1;
    groups.set(password, [...(groups.get(password) ?? []), lineNumber]);
  });
  return [...groups.values()].filter((lines) => lines.length > 1);
}
