<script lang="ts">
  import { goto } from "$app/navigation";
	import { generateSeed, mulberry32, type RNG } from "$lib/Random";

</script>

<div class="p-2 flex flex-col gap-2 w-full h-full justify-center items-center">
  <h1 class="text-2xl font-bold">Welcome to Voronoi Sweeper</h1>
  <button class="button" on:click={() => goto(`/game/${generateSeed()}`)}>
    Start Game
  </button>
</div>

