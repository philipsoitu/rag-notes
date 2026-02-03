<script lang="ts">
  import ClassList, { type ClassRow } from '$lib/components/ClassList.svelte';
  import CreateClassForm from '$lib/components/CreateClassForm.svelte';

  let classes: ClassRow[] = [];
  let loading = true;
  let error: string | null = null;

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/classes');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load classes');
      classes = json.classes;
    } catch (e: any) {
      error = e.message ?? 'Unknown error';
    } finally {
      loading = false;
    }
  }

  load();
</script>

<main>
  <h1>RAG Notes</h1>

  <CreateClassForm on:created={load} />

  {#if loading}
    <p>Loading…</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <ClassList {classes} />
  {/if}
</main>

<style>
  main { max-width: 900px; margin: 2rem auto; padding: 0 1rem; display:flex; flex-direction:column; gap: 1rem; }
  .error { color: #b00020; }
</style>
