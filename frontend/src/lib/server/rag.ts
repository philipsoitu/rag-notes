import { supabaseAdmin } from './supabase';
import { embedText, chatWithGemini } from './gemini';
import { TOP_K } from '$env/static/private';

type RawMatch = {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  similarity: number;
};

export async function ragAnswer(params: { classId: string; question: string }) {
  const topK = Number(TOP_K || 8);
  const qEmbedding = await embedText(params.question);

  const { data, error } = await supabaseAdmin.rpc('match_chunks', {
    p_class_id: params.classId,
    p_query_embedding: qEmbedding,
    p_match_count: topK
  });

  if (error) throw new Error(`match_chunks RPC failed: ${error.message}`);

  const matches = (data ?? []) as RawMatch[];

  // Fetch document titles for matches
  const docIds = Array.from(new Set(matches.map((m) => m.document_id)));
  const { data: docs, error: docErr } = await supabaseAdmin
    .from('documents')
    .select('id,title,created_at')
    .in('id', docIds);

  if (docErr) throw new Error(`documents fetch failed: ${docErr.message}`);

  const docMap = new Map(
    (docs ?? []).map((d: any) => [d.id, d])
  );

  const sources = matches.map((m, idx) => {
    const d = docMap.get(m.document_id);
    return {
      sourceNumber: idx + 1,
      chunkId: m.id,
      documentId: m.document_id,
      documentTitle: d?.title ?? 'Untitled transcript',
      chunkIndex: m.chunk_index,
      similarity: m.similarity,
      preview: m.content.slice(0, 220) + (m.content.length > 220 ? '…' : '')
    };
  });

  const contextBlock = matches
    .map((m, idx) => `[[Source ${idx + 1}]]\n${m.content}`)
    .join('\n\n---\n\n');

  const prompt = [
    `You are a study assistant. Answer using ONLY the provided lecture transcript excerpts.`,
    `If the excerpts do not contain the answer, say you don't know.`,
    ``,
    `Question: ${params.question}`,
    ``,
    `Excerpts:\n${contextBlock}`,
    ``,
    `Return a concise answer, then a short bullet list of which sources you used (Source 1, Source 2, etc.).`
  ].join('\n');

  const answer = await chatWithGemini(prompt);

  return { answer, sources };
}
