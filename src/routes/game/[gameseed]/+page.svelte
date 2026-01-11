<script lang="ts">
	import { goto } from "$app/navigation";
	import Board from "$lib/components/Board.svelte";
	import { generateSeed } from "$lib/Random";
	import type { PageData } from "./$types";

	export let data: PageData;
	const gameseed = data.gameseed;
	const newGameUrl = `/game/${generateSeed()}`;
</script>

<div class="flex h-screen w-full flex-col gap-2">
	<div class="flex w-full justify-between bg-gray-300 p-2">
		<div>
			<a class="button" href="/">Home</a>
			<a class="button" href={newGameUrl} data-sveltekit-reload> New Game </a>
		</div>
		Voronoi Sweeper
		<span><b>Seed:</b>{" " + gameseed}</span>
	</div>

	<div class="flex w-full justify-center">
		<Board seed={gameseed} />
	</div>
</div>
