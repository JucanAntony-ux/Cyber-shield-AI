import { buildResult, type Check } from './analysis';
import type { AnalysisResult, KnownFileHash } from './types';

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export type Signature =
  | 'windows-program'
  | 'linux-program'
  | 'pdf'
  | 'zip-archive'
  | 'png-image'
  | 'jpeg-image'
  | 'gif-image'
  | 'script'
  | 'text'
  | 'unknown';

export const SIGNATURE_LABELS: Record<Signature, string> = {
  'windows-program': 'a Windows program',
  'linux-program': 'a Linux program',
  pdf: 'a PDF document',
  'zip-archive': 'a ZIP archive or Office document',
  'png-image': 'a PNG image',
  'jpeg-image': 'a JPEG image',
  'gif-image': 'a GIF image',
  script: 'a script',
  text: 'plain text',
  unknown: 'an unrecognized format',
};

const RISKY_EXTENSIONS = new Set(['exe', 'msi', 'scr', 'bat', 'cmd', 'ps1', 'vbs', 'js', 'jar', 'com', 'hta', 'lnk']);

const EXPECTED_SIGNATURES: Record<string, Signature[]> = {
  exe: ['windows-program'],
  dll: ['windows-program'],
  pdf: ['pdf'],
  zip: ['zip-archive'],
  docx: ['zip-archive'],
  xlsx: ['zip-archive'],
  pptx: ['zip-archive'],
  png: ['png-image'],
  jpg: ['jpeg-image'],
  jpeg: ['jpeg-image'],
  gif: ['gif-image'],
};

const DOUBLE_EXTENSION = /\.(pdf|docx?|xlsx?|pptx?|jpe?g|png|gif|txt|zip)\.(exe|scr|js|vbs|bat|cmd|ps1|hta|lnk|com)$/i;

function startsWith(header: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => header[index] === byte);
}

export function detectSignature(header: Uint8Array): Signature {
  if (startsWith(header, [0x4d, 0x5a])) return 'windows-program';
  if (startsWith(header, [0x7f, 0x45, 0x4c, 0x46])) return 'linux-program';
  if (startsWith(header, [0x25, 0x50, 0x44, 0x46])) return 'pdf';
  if (startsWith(header, [0x50, 0x4b, 0x03, 0x04])) return 'zip-archive';
  if (startsWith(header, [0x89, 0x50, 0x4e, 0x47])) return 'png-image';
  if (startsWith(header, [0xff, 0xd8, 0xff])) return 'jpeg-image';
  if (startsWith(header, [0x47, 0x49, 0x46, 0x38])) return 'gif-image';
  if (startsWith(header, [0x23, 0x21])) return 'script';
  if (header.length > 0 && header.every((byte) => byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte < 127))) {
    return 'text';
  }
  return 'unknown';
}

export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  if (!crypto.subtle) {
    throw new Error('This page cannot compute file fingerprints. Open the app over a secure (https) connection.');
  }
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export interface FileTraits {
  name: string;
  size: number;
  header: Uint8Array;
  known: KnownFileHash | null;
}

export function analyzeFileTraits({ name, size, header, known }: FileTraits): {
  signature: Signature;
  result: AnalysisResult;
} {
  const signature = detectSignature(header);
  const dot = name.lastIndexOf('.');
  const extension = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
  const expected = EXPECTED_SIGNATURES[extension];
  const checks: Check[] = [];
  const add = (weight: number, severity: Check['finding']['severity'], text: string) =>
    checks.push({ weight, finding: { severity, text } });

  if (size === 0) {
    add(5, 'info', 'The file is empty.');
  }
  if (known) {
    const dangerous = known.verdict === 'dangerous';
    add(
      dangerous ? 100 : 45,
      dangerous ? 'danger' : 'warning',
      `Matches a known flagged file fingerprint: ${known.label}. ${known.note}`,
    );
  }
  if (DOUBLE_EXTENSION.test(name)) {
    add(60, 'danger', 'Has a double extension, a document name followed by a program ending. This is a common disguise.');
  }
  if (RISKY_EXTENSIONS.has(extension)) {
    add(20, 'warning', `Program or script file type (.${extension}). Only run it if you trust where it came from.`);
  }
  if (expected && signature !== 'unknown' && !expected.includes(signature)) {
    add(
      45,
      'danger',
      `The name ends in .${extension}, but the contents look like ${SIGNATURE_LABELS[signature]}. Do not open it until it is verified.`,
    );
  }
  if (!expected && !RISKY_EXTENSIONS.has(extension) && (signature === 'windows-program' || signature === 'linux-program')) {
    add(30, 'warning', 'The contents are a program even though the name does not say so.');
  }

  return { signature, result: buildResult(checks) };
}
