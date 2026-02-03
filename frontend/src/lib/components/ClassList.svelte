<script lang="ts">
  export type ClassRow = { id: string; name: string; created_at: string };

  export let classes: ClassRow[] = [];
</script>

<div class="card">
  <h2>Your classes</h2>

  {#if classes.length === 0}
    <p>No classes yet. Create one!</p>
  {:else}
    <ul>
      {#each classes as c (c.id)}
        <li>
          <a href={"/" + c.id}>{c.name}</a>
          <span class="meta">{new Date(c.created_at).toLocaleString()}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .card { padding: 1rem; border: 1px solid #ddd; border-radius: 12px; }
  ul { list-style: none; padding: 0; margin: .5rem 0 0; }
  li { display:flex; justify-content: space-between; gap: 1rem; padding: .6rem 0; border-top: 1px solid #eee; }
  li:first-child { border-top: 0; }
  a { text-decoration: none; }
  .meta { color: #666; font-size: .9rem; }
</style>
