import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { chunkText } from '$lib/server/chunking';
import { embedText } from '$lib/server/gemini';

export async function POST({ params, request }) {
  const classId = params.classId;
  const body = await request.json().catch(() => ({}));

  const title = String(body?.title ?? '').trim() || null;
  const rawText = String(body?.rawText ?? '').trim();

  if (!rawText) return json({ error: 'rawText is required' }, { status: 400 });

  // create document row
  const { data: doc, error: docErr } = await supabaseAdmin
    .from('documents')
    .insert({ class_id: classId, title, raw_text: rawText })
    .select('id')
    .single();

  if (docErr) return json({ error: docErr.message }, { status: 500 });

  const chunks = chunkText(rawText);
  if (chunks.length === 0) return json({ ok: true, chunksInserted: 0 });

  // embed + insert chunks
  // MVP: sequential embeddings (simple + reliable). Can batch later.
  const rows = [];
  for (let i = 0; i < chunks.length; i++) {
    const content = chunks[i];
    const embedding = await embedText(content);

    rows.push({
      class_id: classId,
      document_id: doc.id,
      chunk_index: i,
      content,
      embedding
    });
  }

  const { error: chunkErr } = await supabaseAdmin.from('chunks').insert(rows);
  if (chunkErr) return json({ error: chunkErr.message }, { status: 500 });

  return json({ ok: true, chunksInserted: rows.length });
}
