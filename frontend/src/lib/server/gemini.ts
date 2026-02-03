import { GEMINI_API_KEY } from '$env/static/private';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Embeddings model (Google AI Studio):
// commonly used: "text-embedding-004"
const EMBEDDING_MODEL = 'models/text-embedding-004';

// Chat model:
// commonly used: "gemini-1.5-flash" or "gemini-1.5-pro"
const CHAT_MODEL = 'models/gemini-2.5-flash-lite';

export async function embedText(input: string): Promise<number[]> {
  const url = `${GEMINI_BASE}/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      content: {
        parts: [{ text: input }]
      }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini embedContent failed: ${res.status} ${err}`);
  }

  const json = await res.json();
  // shape: { embedding: { values: number[] } }
  return json.embedding.values as number[];
}

export async function chatWithGemini(prompt: string): Promise<string> {
  const url = `${GEMINI_BASE}/${CHAT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800
      }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini generateContent failed: ${res.status} ${err}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
  return text.trim();
}
