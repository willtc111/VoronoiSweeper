<script lang="ts">
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import LightSwitch from "$lib/components/LightSwitch.svelte";
	import { generateSeed } from "$lib/Random";

	function pad0(v: number): string {
		return String(v).padStart(2, "0");
	}

	const now = new Date();
	const gotd = `${now.getFullYear()}${pad0(now.getMonth() + 1)}${pad0(now.getDate())}`;
</script>

<title> Voronoi Sweeper </title>

<div class="flex justify-end p-2">
	<LightSwitch />
</div>

<div class="flex h-full w-full flex-col items-center justify-center gap-8 p-2">
	<section class="flex flex-col gap-2">
		<h1 class="text-2xl font-bold text-center">
			<span class="inline-block">Welcome to</span>
			<span class="inline-block">Voronoi Sweeper</span>
		</h1>
		<div class="flex justify-center gap-2">
			<button class="btn preset-filled-primary-500" on:click={() => goto(resolve(`/game/${gotd}`))}>
				Game of the day
			</button>
			<button
				class="btn preset-filled-primary-500"
				on:click={() => goto(resolve(`/game/${generateSeed()}`))}
			>
				Random Game
			</button>
		</div>
	</section>

	<section class="flex w-full sm:w-1/2 flex-col items-start justify-start gap-2">
		<h2 class="text-lg font-bold">What is Voronoi Sweeper?</h2>
		<span>
			Voronoi Sweeper is a more generic implementation of the game Minesweeper. Instead of using a
			full grid of square cells, it uses an arbitrary arrangement of convex cells. This allows for a
			wider variety of connection patterns between neighboring cells.
		</span>
		<span>
			Click a cell to reveal it, or right click a cell to flag it as a potential mine. Cells are
			highlighted to indicate which cells neighbor the current cell you hover over. If you see a
			connection that doesn't make sense, try clicking and dragging to pan around or scrolling to
			zoom out. The nature of the Voronoi partitioning means that some cells might be touching
			outside of the default view.
		</span>
		<span>
			Boards are generated randomly and mines are set during board generation, so there is no
			guarantee that the first cell you click won't be a mine. If you are unlucky enough to get a
			mine on the first try, you can refresh the page to try again, or just generate a brand new
			game.
		</span>
		<span> Enjoy! And let me know if you find any bugs or fun seeds. </span>
	</section>

	<section class="flex w-full sm:w-1/2 flex-col items-start justify-start gap-2">
		<h2 class="text-lg font-bold">Interesting Seeds</h2>
		<ul>
			<li>
				<a class="a" href={resolve("/game/ij2iei70")}>ij2iei70</a>
				is a normal game of Minesweeper
			</li>
			<li>
				<a class="a" href={resolve("/game/hmfwn2sn")}>hmfwn2sn</a>
				has an 8-cell (above 6 is rare)
			</li>
		</ul>
	</section>
</div>
