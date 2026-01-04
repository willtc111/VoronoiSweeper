<script lang="ts">
  import { goto } from "$app/navigation";

  function generateSeed() {
    return Math.random().toString(36).substring(2, 10);
  }
</script>

<div class="p-2 flex flex-col gap-2 w-full h-full justify-center items-center">
  <h1 class="text-2xl font-bold">Welcome to Voronoi Sweeper</h1>
  <button class="button" on:click={() => goto(`/game/${generateSeed()}`)}>
    Start Game
  </button>
</div>

