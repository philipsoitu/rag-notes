import { CHUNK_SIZE_CHARS, CHUNK_OVERLAP_CHARS } from '$env/static/private';

const size = Number(CHUNK_SIZE_CHARS || 1200);
const overlap = Number(CHUNK_OVERLAP_CHARS || 200);

export function chunkText(raw: string): string[] {
  const text = raw.replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const chunks: string[] = [];
  let i = 0;

  while (i < text.length) {
    const end = Math.min(i + size, text.length);
    const chunk = text.slice(i, end).trim();
    if (chunk) chunks.push(chunk);
    if (end === text.length) break;
    i = Math.max(0, end - overlap);
  }

  return chunks;
}
