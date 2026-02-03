import { supabaseAdmin } from './supabase';
import { embedText, chatWithGemini } from './gemini';
import { TOP_K } from '$env/static/private';

export async function ragAnswer(params: {
  classId: string;
  question: string;
}) {
  const topK = Number(TOP_K || 8);

  const qEmbedding = await embedText(params.question);

  // Call RPC to retrieve relevant chunks scoped to class
  const { data, error } = await supabaseAdmin.rpc('match_chunks', {
    p_class_id: params.classId,
    p_query_embedding: qEmbedding,
    p_match_count: topK
  });

  if (error) throw new Error(`match_chunks RPC failed: ${error.message}`);

  const contexts = (data ?? []).map((r: any, idx: number) => {
    return `[[Source ${idx + 1} | sim=${Number(r.similarity).toFixed(3)}]]\n${r.content}`;
  });

  const prompt = [
    `You are a study assistant. Answer using ONLY the provided lecture transcript excerpts.`,
    `If the excerpts do not contain the answer, say you don't know and suggest what to look for.`,
    ``,
    `Question: ${params.question}`,
    ``,
    `Excerpts:\n${contexts.join('\n\n---\n\n')}`,
    ``,
    `Return a concise answer, then a short bullet list of which sources you used (Source 1, Source 2, etc.).`
  ].join('\n');

  const answer = await chatWithGemini(prompt);

  return { answer, sources: data ?? [] };
}
