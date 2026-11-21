// gta6-clipper-09 entry (Node 22, standard library only).
//
// The entry is the YouTube video itself: an AI agent picked the seaplane
// beat out of Rockstar's "Grand Theft Auto VI: An Extended Look", cut it
// into a vertical Short, pitched make.fun on screen, and uploaded it as
// a public Short. This program is the handoff between the video and the
// gate: it reads VIDEO.json from the repository root, makes sure the
// address in it really points at a YouTube video, and drops the address
// into the output directory for the gate to pick up. Nothing about the
// video is scored here; the program only has to be honest about what
// VIDEO.json says.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The placeholder the starter ships with. It names no video at all, so
// it is carried through untouched and the gate scores it as no video,
// exactly like the starter's own program does. Refusing it here would
// change nothing except the exit code.
const PLACEHOLDER = 'https://www.youtube.com/shorts/<id>';

// A YouTube video address in any of its usual shapes. The id is the
// 11-character token; everything after it (query strings, fragments)
// is ignored.
const YOUTUBE_ADDRESS =
  /^https:\/\/(www\.youtube\.com\/(shorts\/|watch\?v=)|youtu\.be\/)([A-Za-z0-9_-]{11})([?&#].*)?$/;

function readVideoUrl(botDir: string): string {
  let raw: string;
  try {
    raw = readFileSync(join(botDir, 'VIDEO.json'), 'utf8');
  } catch (err) {
    throw new Error(
      `cannot read VIDEO.json in ${botDir}: ${(err as Error).message}`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `VIDEO.json is not valid JSON: ${(err as Error).message}`,
    );
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('VIDEO.json must be a JSON object');
  }
  const url = (parsed as { url?: unknown }).url;
  if (typeof url !== 'string') {
    throw new Error('VIDEO.json must carry a "url" string');
  }
  return url;
}

function canonicalShortsUrl(url: string): string | null {
  if (url === PLACEHOLDER) {
    return null;
  }
  const match = YOUTUBE_ADDRESS.exec(url);
  if (match === null) {
    throw new Error(`not a YouTube video address: ${url}`);
  }
  return `https://www.youtube.com/shorts/${match[3]}`;
}

function main(): void {
  const url = readVideoUrl(BOT_DIR);
  const canonical = canonicalShortsUrl(url);
  mkdirSync(OUTPUT_DIR, { recursive: true });
  // Placeholder goes out byte for byte; a real address goes out in its
  // canonical Shorts form so the gate always sees the same shape.
  const out =
    canonical === null
      ? readFileSync(join(BOT_DIR, 'VIDEO.json'), 'utf8')
      : JSON.stringify({ url: canonical }) + '\n';
  writeFileSync(join(OUTPUT_DIR, 'VIDEO.json'), out, 'utf8');
}

try {
  main();
} catch (err) {
  console.error(`gta6-clipper-09: ${(err as Error).message}`);
  process.exit(1);
}
