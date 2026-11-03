import { buildResult, type Check } from './analysis';
import type { AnalysisResult } from './types';

const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly'];
const RISKY_TLDS = ['zip', 'top', 'xyz', 'click', 'gq', 'tk', 'ml', 'cf'];
const BRANDS = [
  'paypal', 'apple', 'microsoft', 'google', 'amazon', 'netflix', 'facebook', 'instagram',
  'chase', 'wellsfargo', 'bankofamerica', 'dropbox', 'docusign',
];
const LURE_WORDS = ['login', 'signin', 'verify', 'account', 'secure', 'update', 'password', 'confirm', 'bank', 'wallet', 'payment', 'billing', 'unlock', 'suspend'];

export type LinkCheck =
  | { ok: true; host: string; result: AnalysisResult }
  | { ok: false; error: string };

export function analyzeLink(input: string): LinkCheck {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: 'Paste a link to check.' };
  }

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { ok: false, error: 'That does not look like a web address. Check for typos and try again.' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Only web links (http or https) can be checked.' };
  }

  const host = url.hostname.toLowerCase();
  const labels = host.split('.');
  const tld = labels[labels.length - 1];
  const lower = trimmed.toLowerCase();
  const checks: Check[] = [];
  const add = (weight: number, severity: Check['finding']['severity'], text: string) =>
    checks.push({ weight, finding: { severity, text } });

  if (url.protocol === 'http:') {
    add(8, 'warning', 'Not encrypted: the link uses http instead of https.');
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    add(35, 'danger', 'Uses a raw number address instead of a website name.');
  }
  if (url.username || url.password) {
    add(40, 'danger', 'Contains a login section before the site name, a common way to disguise the real destination.');
  }
  if (host.includes('xn--')) {
    add(25, 'danger', 'Uses special characters that can imitate another site name.');
  }
  if (labels.length >= 5) {
    add(15, 'warning', 'Has many subdomains, which can hide the real site name.');
  }
  if (RISKY_TLDS.includes(tld)) {
    add(15, 'warning', `Uses the .${tld} ending, which is common on short-lived scam sites.`);
  }
  if (SHORTENERS.includes(host)) {
    add(15, 'warning', 'Is a shortened link, so the real destination is hidden.');
  }
  if ((host.match(/-/g) ?? []).length >= 3) {
    add(10, 'warning', 'Uses many hyphens, a pattern common in fake sites.');
  }
  const lureWords = LURE_WORDS.filter((word) => lower.includes(word));
  if (lureWords.length >= 2) {
    add(15, 'warning', `Contains several account-related words (${lureWords.slice(0, 3).join(', ')}), which scam pages often use.`);
  }
  const impersonated = BRANDS.find((brand) => host.includes(brand) && host !== `${brand}.com` && !host.endsWith(`.${brand}.com`));
  if (impersonated) {
    add(40, 'danger', `Mentions "${impersonated}" but is not on the official ${impersonated}.com domain.`);
  }
  if (trimmed.length > 120) {
    add(5, 'warning', 'Very long address, which can be used to hide the destination.');
  }

  return { ok: true, host, result: buildResult(checks) };
}

export type EmailCheck =
  | { ok: true; subject: string; result: AnalysisResult }
  | { ok: false; error: string };

export function analyzeEmail(input: string): EmailCheck {
  const text = input.trim();
  if (text.length < 10) {
    return { ok: false, error: 'Paste the full message text so it can be checked.' };
  }

  const lower = text.toLowerCase();
  const checks: Check[] = [];
  const add = (weight: number, severity: Check['finding']['severity'], message: string) =>
    checks.push({ weight, finding: { severity, text: message } });

  if (/\b(urgent|immediately|within 24 hours|act now|final notice|account (will be )?(suspended|locked|closed)|expires? (today|soon))\b/.test(lower)) {
    add(20, 'warning', 'Creates urgency or fear, a common way to rush people into acting.');
  }
  if (
    /\b(password|passcode|one-time code|verification code|otp|social security|ssn|pin number|login details)\b/.test(lower) &&
    /\b(confirm|verify|update|validate|re-?enter|provide|send)\b/.test(lower)
  ) {
    add(30, 'danger', 'Asks you to confirm or send sensitive details such as a password or code. Legitimate services rarely do this by email.');
  }
  if (/\b(gift cards?|wire transfer|bitcoin|crypto|payment (failed|due|declined)|refund|invoice)\b/.test(lower)) {
    add(20, 'warning', 'Mentions payments, gift cards, or invoices. Confirm any payment request through a separate, trusted channel.');
  }
  if (/\b(open the attached|attached (file|document|invoice)|enable (macros|content)|download the attachment)\b/.test(lower)) {
    add(20, 'warning', 'Asks you to open an attachment or enable content, a common way malware is delivered.');
  }
  if (/\bdear (customer|user|client|member|valued|sir|madam)\b/.test(lower)) {
    add(10, 'warning', 'Uses a generic greeting instead of your name.');
  }

  const links = text.match(/https?:\/\/[^\s<>"')]+/gi) ?? [];
  const flagged = links
    .map((link) => analyzeLink(link))
    .flatMap((check) => (check.ok && check.result.verdict !== 'safe' ? [check] : []));
  if (flagged.length > 0) {
    const dangerous = flagged.some((check) => check.ok && check.result.verdict === 'dangerous');
    add(
      dangerous ? 30 : 15,
      dangerous ? 'danger' : 'warning',
      `Contains ${flagged.length} link(s) that look risky, including one that points to ${flagged[0].ok ? flagged[0].host : 'an unknown site'}.`,
    );
  }
  if (links.length >= 4) {
    add(10, 'warning', 'Contains many links. Each one can lead somewhere different.');
  }

  return { ok: true, subject: `Email message with ${links.length} link(s)`, result: buildResult(checks) };
}
