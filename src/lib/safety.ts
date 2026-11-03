const HARMFUL_REQUEST_PATTERNS: RegExp[] = [
  /\b(hack|break|get|sneak|force)\s+(in)?to\s+(someone|somebody|another|their|her|his|my\s+(ex|partner|boss|neighbou?r|school))\b/i,
  /\b(steal|harvest|dump|collect)\s+(other\s+people'?s|people'?s|someone'?s|anyone'?s|their)?\s*(passwords?|credentials|login\s+details|card\s+numbers?)\b/i,
  /\b(crack|brute[- ]?force)\s+(a\s+|the\s+|someone'?s\s+|my\s+|their\s+)?(passwords?|wi-?fi|wpa2?|wpa3|router)\b/i,
  /\b(write|build|create|make|code)\s+(a\s+|an\s+|some\s+)?(malware|virus|ransomware|keylogger|trojan|botnet|rootkit)\b/i,
  /\b(launch|run|start|perform)\s+(a\s+)?(ddos|denial[- ]of[- ]service)\b/i,
  /\b(bypass|evade)\s+(the\s+)?(antivirus|edr|detection|two-?factor|2fa|mfa|multi-?factor)\b/i,
  /\b(exploit|attack|hack)\s+(a\s+|an\s+|the\s+|this\s+|their\s+|someone'?s\s+|my\s+school'?s\s+|my\s+company'?s\s+)(website|server|network|site|router|account)\b/i,
];

const SENSITIVE_DATA_PATTERNS: RegExp[] = [
  /\b(password|passcode|passwd|pin)\s*(is|=|:)\s*\S+/i,
  /\b(api[ _-]?key|secret[ _-]?key|access[ _-]?token|private key)\s*(is|=|:)\s*\S+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(?:\d[ -]?){13,19}\b/,
  /\b\d{3}-\d{2}-\d{4}\b/,
];

export type SubmissionReview = 'ok' | 'harmful' | 'sensitive';

export function reviewSubmission(text: string): SubmissionReview {
  if (SENSITIVE_DATA_PATTERNS.some((pattern) => pattern.test(text))) {
    return 'sensitive';
  }
  if (HARMFUL_REQUEST_PATTERNS.some((pattern) => pattern.test(text))) {
    return 'harmful';
  }
  return 'ok';
}
