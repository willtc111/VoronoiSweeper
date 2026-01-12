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

<div class="flex h-screen flex-col">
	<!-- HEADER -->
	<div class="absolute right-0 p-2">
		<LightSwitch />
	</div>
	<div class="flex flex-col-reverse sm:grid sm:grid-cols-3 bg-surface-50-950 p-2">
		<div class="flex justify-center sm:justify-start gap-2">
			<a class="btn preset-filled-primary-500" href={resolve("/")}>
				Home
			</a>
			<a
				class="btn preset-filled-primary-500"
				href={newGameUrl}
				data-sveltekit-reload
			>
				New Game
			</a>
		</div>

		<div class="grow text-center font-bold">Voronoi Sweeper</div>
	</div>

	<!-- GAME -->
	<div class="flex justify-center">
		<Board seed={gameseed} />
	</div>
</div>
