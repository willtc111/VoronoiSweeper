<script lang="ts">
	import { goto } from "$app/navigation";
	import { generateSeed, mulberry32, type RNG } from "$lib/Random";
</script>

<div class="flex h-full w-full flex-col items-center justify-center gap-2 p-2">
	<h1 class="text-2xl font-bold">Welcome to Voronoi Sweeper</h1>
	<button class="button" on:click={() => goto(`/game/${generateSeed()}`)}> Start Game </button>
</div>
