<script lang="ts">
  import TranscriptForm from '$lib/components/TranscriptForm.svelte';
  import ChatBox from '$lib/components/ChatBox.svelte';

  export let data: { cls: { id: string; name: string } };
</script>

<main>
  <a href="/">← Back</a>
  <h1>{data.cls.name}</h1>

  <div class="grid">
    <TranscriptForm classId={data.cls.id} />
    <ChatBox classId={data.cls.id} />
  </div>
</main>

<style>
  main { max-width: 1100px; margin: 2rem auto; padding: 0 1rem; }
  .grid { display:grid; gap: 1rem; grid-template-columns: 1fr; margin-top: 1rem; }
  @media (min-width: 900px) {
    .grid { grid-template-columns: 1fr 1fr; align-items: start; }
  }
</style>
