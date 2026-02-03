<script lang="ts">
  export let classId: string;

  type Msg = { role: 'user' | 'assistant'; text: string };

  let messages: Msg[] = [];
  let question = '';
  let loading = false;
  let error: string | null = null;

  async function ask() {
    error = null;
    const q = question.trim();
    if (!q) return;

    messages = [...messages, { role: 'user', text: q }];
    question = '';
    loading = true;

    try {
      const res = await fetch(`/api/classes/${classId}/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: q })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Chat failed');

      messages = [...messages, { role: 'assistant', text: json.answer }];
    } catch (e: any) {
      error = e.message ?? 'Unknown error';
    } finally {
      loading = false;
    }
  }
</script>

<div class="card">
  <h2>Ask your notes</h2>

  <div class="chat">
    {#each messages as m, i (i)}
      <div class={"msg " + m.role}>
        <div class="role">{m.role}</div>
        <div class="text">{m.text}</div>
      </div>
    {/each}
  </div>

  <div class="row">
    <input
      placeholder="Ask a question…"
      bind:value={question}
      on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && ask()}
    />
    <button disabled={loading || !question.trim()} on:click={ask}>
      {loading ? '…' : 'Send'}
    </button>
  </div>

  {#if error}<p class="error">{error}</p>{/if}
</div>

<style>
  .card { padding: 1rem; border: 1px solid #ddd; border-radius: 12px; }
  .chat { display:flex; flex-direction:column; gap:.6rem; margin:.75rem 0; max-height: 380px; overflow:auto; }
  .msg { padding:.6rem .7rem; border-radius: 12px; border: 1px solid #eee; }
  .msg.user { background: #fafafa; }
  .msg.assistant { background: #fff; }
  .role { font-size: .8rem; color:#666; margin-bottom:.25rem; }
  .row { display:flex; gap:.5rem; }
  input { flex:1; padding:.6rem .7rem; border:1px solid #ccc; border-radius:10px; }
  button { padding:.6rem .9rem; border-radius:10px; border:1px solid #ccc; }
  .error { color: #b00020; margin-top: .5rem; }
</style>
