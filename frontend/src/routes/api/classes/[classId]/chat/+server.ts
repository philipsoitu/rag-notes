import { json } from '@sveltejs/kit';
import { ragAnswer } from '$lib/server/rag';

export async function POST({ params, request }) {
  const classId = params.classId;
  const body = await request.json().catch(() => ({}));
  const question = String(body?.question ?? '').trim();

  if (!question) return json({ error: 'question is required' }, { status: 400 });

  try {
    const result = await ragAnswer({ classId, question });
    return json(result);
  } catch (e: any) {
    return json({ error: e?.message ?? 'unknown error' }, { status: 500 });
  }
}
