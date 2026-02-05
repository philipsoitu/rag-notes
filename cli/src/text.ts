export function chunkText(text: string, chunkSize = 800, overlap = 150) {
  const clean = text.replace(/\r\n/g, "\n");
  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end === clean.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}
