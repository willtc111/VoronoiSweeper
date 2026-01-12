<script lang="ts">
	import { resolve } from '$app/paths';
	import Board from "$lib/components/Board.svelte";
	import LightSwitch from "$lib/components/LightSwitch.svelte";
	import { generateSeed } from "$lib/Random";
	import type { PageData } from "./$types";

	export let data: PageData;
	const gameseed = data.gameseed;
	const newGameUrl = resolve(`/game/${generateSeed()}`);
</script>

<title> Voronoi Sweeper </title>

<div class="flex h-screen w-full flex-col">
	<div class="grid grid-cols-3 bg-surface-50-950 p-2">
		<div class="justify-left flex gap-2">
			<a class="btn preset-filled-primary-500" href={resolve("/")}>Home</a>
			<a class="btn preset-filled-primary-500" href={newGameUrl} data-sveltekit-reload>
				New Game
			</a>
		</div>
		<div class="text-center font-bold">Voronoi Sweeper</div>
		<div class="flex justify-end">
			<LightSwitch />
		</div>
	</div>

	<div class="flex w-full justify-center">
		<Board seed={gameseed} />
	</div>
</div>
