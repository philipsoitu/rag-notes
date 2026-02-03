import { error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';

export async function load({ params }) {
  const id = params.classId;

  const { data, error: e } = await supabaseAdmin
    .from('classes')
    .select('id,name,created_at')
    .eq('id', id)
    .single();

  if (e || !data) throw error(404, 'Class not found');

  return { cls: data };
}
