<script lang="ts">
	import { goto } from "$app/navigation";
	import { generateSeed } from "$lib/Random";

	function pad0(v: number): string {
		return String(v).padStart(2,"0");
	}

	const now = new Date();
	const gotd = `${now.getFullYear()}${pad0(now.getMonth()+1)}${pad0(now.getDate())}`;
</script>

<div class="flex h-full w-full flex-col items-center justify-center gap-2 p-2">
	<h1 class="text-2xl font-bold">Welcome to Voronoi Sweeper</h1>
	<button
		class="btn preset-filled-primary-500"
		on:click={() => goto(`/game/${gotd}`)}
	>
		Game of the day
	</button>
	<button
		class="btn preset-filled-primary-500"
		on:click={() => goto(`/game/${generateSeed()}`)}
	>
		Random Game
	</button>
</div>
