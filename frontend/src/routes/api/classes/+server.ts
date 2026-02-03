import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('classes')
    .select('id,name,created_at')
    .order('created_at', { ascending: false });

  if (error) return json({ error: error.message }, { status: 500 });
  return json({ classes: data });
}

export async function POST({ request }) {
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? '').trim();

  if (!name) return json({ error: 'name is required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('classes')
    .insert({ name })
    .select('id,name,created_at')
    .single();

  if (error) return json({ error: error.message }, { status: 500 });
  return json({ class: data });
}
