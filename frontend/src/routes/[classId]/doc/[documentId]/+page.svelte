<script lang="ts">
  import { page } from '$app/stores';
  export let data: {
    doc: { id: string; title: string | null; created_at: string; raw_text: string };
    chunks: { id: string; chunk_index: number; content: string }[];
  };
</script>

<main>
  <a href={"/" + $page.params.classId}>← Back to class</a>
  <h1>{data.doc.title ?? "Untitled transcript"}</h1>
  <p class="meta">{new Date(data.doc.created_at).toLocaleString()}</p>

  <h2>Chunks</h2>
  <div class="chunks">
    {#each data.chunks as c (c.id)}
      <section id={"chunk-" + c.chunk_index} class="chunk">
        <h3>Chunk {c.chunk_index}</h3>
        <pre>{c.content}</pre>
      </section>
    {/each}
  </div>
</main>

<style>
  main { max-width: 1000px; margin: 2rem auto; padding: 0 1rem; }
  .meta { color: #666; }
  .chunk { border: 1px solid #eee; border-radius: 12px; padding: 1rem; margin: 1rem 0; }
  pre { white-space: pre-wrap; margin: 0.5rem 0 0; }
</style>

