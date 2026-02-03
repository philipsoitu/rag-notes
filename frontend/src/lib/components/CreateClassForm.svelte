<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ created: void }>();

  let name = '';
  let loading = false;
  let error: string | null = null;

  async function createClass() {
    error = null;
    const trimmed = name.trim();
    if (!trimmed) return;

    loading = true;
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create class');

      name = '';
      dispatch('created');
    } catch (e: any) {
      error = e.message ?? 'Unknown error';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={createClass} class="card">
  <h2>Create a class</h2>

  <div class="row">
    <input placeholder="e.g. COMP 273" bind:value={name} />
    <button disabled={loading || !name.trim()}>
      {loading ? 'Creating…' : 'Create'}
    </button>
  </div>

  {#if error}<p class="error">{error}</p>{/if}
</form>

<style>
  .card { padding: 1rem; border: 1px solid #ddd; border-radius: 12px; }
  .row { display:flex; gap:.5rem; }
  input { flex:1; padding:.6rem .7rem; border:1px solid #ccc; border-radius:10px; }
  button { padding:.6rem .9rem; border-radius:10px; border:1px solid #ccc; }
  .error { color: #b00020; margin-top: .5rem; }
</style>
