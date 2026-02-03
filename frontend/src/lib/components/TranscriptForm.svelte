<script lang="ts">
  export let classId: string;

  let title = '';
  let rawText = '';
  let loading = false;
  let msg: string | null = null;
  let error: string | null = null;

  async function submit() {
    msg = null;
    error = null;

    const text = rawText.trim();
    if (!text) return;

    loading = true;
    try {
      const res = await fetch(`/api/classes/${classId}/documents`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || null, rawText: text })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');

      msg = `Uploaded and indexed ${json.chunksInserted} chunks.`;
      title = '';
      rawText = '';
    } catch (e: any) {
      error = e.message ?? 'Unknown error';
    } finally {
      loading = false;
    }
  }
</script>

<div class="card">
  <h2>Add transcript</h2>
  <input placeholder="Optional title (Lecture 3…)" bind:value={title} />

  <textarea
    placeholder="Paste transcript text here…"
    rows="10"
    bind:value={rawText}
  />

  <button disabled={loading || !rawText.trim()} on:click={submit}>
    {loading ? 'Indexing…' : 'Add & vectorize'}
  </button>

  {#if msg}<p class="ok">{msg}</p>{/if}
  {#if error}<p class="error">{error}</p>{/if}
</div>

<style>
  .card { padding: 1rem; border: 1px solid #ddd; border-radius: 12px; }
  input, textarea { width: 100%; margin: .5rem 0; padding: .6rem .7rem; border:1px solid #ccc; border-radius:10px; }
  button { padding:.6rem .9rem; border-radius:10px; border:1px solid #ccc; }
  .ok { color: #0a7a2f; margin-top: .5rem; }
  .error { color: #b00020; margin-top: .5rem; }
</style>
