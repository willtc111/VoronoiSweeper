<script lang="ts">
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import LightSwitch from "$lib/components/LightSwitch.svelte";
	import { generateSeed } from "$lib/Random";
	import { onMount } from "svelte";
	import type { PageData } from "./$types";
	import type { LeaderboardEntry } from "$lib/Leaderboard";
	import { millisecondsToTimeString } from "$lib/conversions";

	export let data: PageData;
	let latestGames: LeaderboardEntry[] = data.latestGames;

	function pad0(v: number): string {
		return String(v).padStart(2, "0");
	}

	const now = new Date();
	const gotd = `${now.getFullYear()}${pad0(now.getMonth() + 1)}${pad0(now.getDate())}`;

	let saveSeed: string | undefined = undefined;
	onMount(() => {
		saveSeed = localStorage.getItem("saveSeed") ?? undefined;
	});

	function reformatDateSeed(seed: string): string {
		// YYYYMMDD format
		const year = seed.slice(0, 4);
		const month = seed.slice(4, 6);
		const day = seed.slice(6, 8);
		return `${month}/${day}/${year}`;
	}
</script>

<title> Voronoi Sweeper </title>

<div class="flex justify-end p-2">
	<LightSwitch />
</div>

<div class="mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center gap-8 p-2">
	<section class="flex flex-col gap-2">
		<h1 class="text-center text-2xl font-bold">
			<span class="inline-block">Welcome to</span>
			<span class="inline-block">Voronoi Sweeper</span>
		</h1>
		<div class="flex flex-col items-center justify-center gap-2 sm:flex-row">
			<button class="btn preset-filled-primary-500" on:click={() => goto(resolve(`/game/${gotd}`))}>
				Game of the Day
			</button>
			<button
				class="btn preset-filled-primary-500"
				on:click={() => goto(resolve(`/game/${generateSeed()}`))}
			>
				Random Game
			</button>
			<button
				class="btn preset-filled-primary-500"
				disabled={saveSeed == undefined}
				on:click={() => goto(resolve(`/game/${saveSeed}`))}
			>
				Continue Game
			</button>
		</div>
	</section>

	{#if latestGames.length != 0}
		<section class="flex w-full flex-col items-start justify-start gap-2">
			<h2 class="text-lg font-bold">Latest Game of the Day High Scores</h2>
			<p>Can you beat their times? Click on an entry to try the same game!</p>
			<table class="mx-auto mt-1 w-full max-w-lg table-fixed border-collapse font-mono">
				<thead>
					<tr class="border-b border-surface-300-700 text-lg">
						<th class="pl-2 text-left">NAME</th>
						<th class="text-left">GAME DATE</th>
						<th class="pr-2 text-right">TIME</th>
					</tr>
				</thead>
				<tbody>
					{#each latestGames as entry}
						<tr
							class="cursor-pointer hover:bg-surface-200-800"
							on:click={() => goto(resolve(`/game/${entry.game_id}`))}
						>
							<td class="pl-2 text-left">{entry.name}</td>
							<td class="text-left">{reformatDateSeed(entry.game_id)}</td>
							<td class="pr-2 text-right">{millisecondsToTimeString(entry.time_ms)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}

	<section class="flex w-full flex-col items-start justify-start gap-2">
		<h2 class="text-lg font-bold">How to Play</h2>
		<p>
			Voronoi Sweeper is a variation of the classic puzzle game Minesweeper. All of the same
			gameplay mechanics apply. Reveal a cell to see the number of neighboring mines (touching walls
			and corners). If you reveal a mine, you lose. The goal is to reveal all of the non-mine cells
			as fast as possible. You may flag cells to help keep track of where you think the mines are.
			Flagged cells can not be clicked for revealing, but may be unflagged at any time.
		</p>
		<p>
			Game progress is saved automatically, and you can resume your most recent game with the
			"Continue Game" button above.
		</p>
		<p>
			When you finish a game, enter your initials in the leaderboard and submit your high score.
		</p>
		<p>
			You can share the current game by sharing the URL. The "Share Link" button at the bottom of
			the game page will copy the URL to your clipboard.
		</p>
	</section>

	<section class="flex w-full flex-col items-start justify-start">
		<h2 class="mb-2 text-lg font-bold">Controls</h2>
		<ul class="list-outside list-disc pl-8">
			<li>Click a cell to reveal it.</li>
			<li>
				Right click or click with flagging toggled on (using the "Flag" button) to flag a cell.
			</li>
			<li>
				Hover over a cell with the mouse cursor to highlight that cell's neighbors. Press and hold
				on mobile, but note that releasing will also click the cell.
			</li>
			<li>
				Click a revealed cell when its flagged neighbors match its number to automatically reveal
				all unflagged neighbors (chording).
			</li>
			<li>
				Flag a revealed cell when its remaining unflagged neighbors must all be mines to
				automatically flag them (flag chording).
			</li>
		</ul>
	</section>

	<section class="flex w-full flex-col items-start justify-start gap-2">
		<h2 class="text-lg font-bold">What is Voronoi Sweeper?</h2>
		<span>
			Voronoi Sweeper is a generalized implementation of the Minesweeper concept. Instead of using a
			full grid of square cells, it partitions the board into convex cells using a
			<a
				href="https://en.wikipedia.org/wiki/Voronoi_diagram"
				target="_blank"
				class="text-blue-500 underline"
			>
				Voronoi diagram
			</a>. This allows for a wider variety of connection patterns between neighboring cells.
		</span>
		<span>
			Boards are generated pseudo-randomly and mines are set during board generation, so there is no
			guarantee that the first cell you click won't be a mine. If you are unlucky enough to get a
			mine on the first try, you can refresh the page to try again, or just generate a brand new
			game. There is also no guarantee that games are always solveable without guessing.
		</span>
		<span> Enjoy! And let me know if you find any bugs or fun seeds. </span>
	</section>

	<section class="flex w-full flex-col items-start justify-start gap-2">
		<h2 class="text-lg font-bold">Interesting Seeds</h2>
		<ul class="flex flex-col gap-2">
			<li>
				<a class="text-blue-500 underline" href={resolve("/game/ij2iei70")}>ij2iei70</a>,
				<a class="text-blue-500 underline" href={resolve("/game/0t8rn4bj")}>0t8rn4bj</a>, and
				<a class="text-blue-500 underline" href={resolve("/game/wj36rv1c")}>wj36rv1c</a>
				are normal games of Minesweeper.
			</li>
			<li>
				<a class="text-blue-500 underline" href={resolve("/game/hmfwn2sn")}>hmfwn2sn</a>
				has an 8-cell (above 6 is rare).
			</li>
		</ul>
	</section>
</div>
