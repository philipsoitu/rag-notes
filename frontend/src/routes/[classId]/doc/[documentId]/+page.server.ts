import { error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';

export async function load({ params }) {
  const { classId, documentId } = params;

  const { data: doc, error: docErr } = await supabaseAdmin
    .from('documents')
    .select('id,class_id,title,raw_text,created_at')
    .eq('id', documentId)
    .eq('class_id', classId)
    .single();

  if (docErr || !doc) throw error(404, 'Document not found');

  // load chunks for jump links + visibility
  const { data: chunks, error: chErr } = await supabaseAdmin
    .from('chunks')
    .select('id,chunk_index,content,created_at')
    .eq('document_id', documentId)
    .order('chunk_index', { ascending: true });

  if (chErr) throw error(500, chErr.message);

  return { doc, chunks: chunks ?? [] };
}
