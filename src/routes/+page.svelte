<script lang="ts">
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import LightSwitch from "$lib/components/LightSwitch.svelte";
	import { generateSeed } from "$lib/Random";
	import { onMount } from "svelte";
	import type { PageData } from "./$types";
	import type { LeaderboardEntry } from "$lib/Leaderboard";
	import { millisecondsToTimeString } from "$lib/conversions";
	import Board from "$lib/components/Board.svelte";
	import Accordion from "$lib/components/Accordion.svelte";

	export let data: PageData;
	const latestGames: LeaderboardEntry[] = data.latestGames;
	const now = new Date();
	const gotd = `${now.getFullYear()}${pad0(now.getMonth() + 1)}${pad0(now.getDate())}`;

	let saveSeed: string | undefined = undefined;

	onMount(() => {
		saveSeed = localStorage.getItem("saveSeed") ?? undefined;
	});

	function pad0(v: number): string {
		return String(v).padStart(2, "0");
	}

	function reformatDateSeed(seed: string): string {
		// Game seed is in YYYYMMDD format
		const year = seed.slice(0, 4);
		const month = seed.slice(4, 6);
		const day = seed.slice(6, 8);
		// Reorder to MM/DD/YYYY format
		return `${month}/${day}/${year}`;
	}
</script>

<title> Voronoi Sweeper </title>

<div class="flex justify-end p-2">
	<LightSwitch />
</div>

<div class="mx-auto flex h-full w-full max-w-4xl flex-col items-center gap-4 p-2">
	<section class="flex flex-col gap-2">
		<h1 class="text-center text-2xl font-bold">
			<span class="inline-block">Welcome to</span>
			<span class="inline-block">Voronoi Sweeper</span>
		</h1>
		<div class="mx-auto flex w-fit flex-col items-center gap-2 sm:grid sm:grid-cols-3">
			<button
				class="btn w-full preset-filled-primary-500"
				on:click={() => goto(resolve(`/game/${gotd}`))}
			>
				Game of the Day
			</button>
			<button
				class="btn w-full preset-filled-primary-500"
				on:click={() => goto(resolve(`/game/${generateSeed()}`))}
			>
				Random Game
			</button>
			<button
				class="btn w-full preset-filled-primary-500"
				disabled={saveSeed == undefined}
				on:click={() => goto(resolve(`/game/${saveSeed}`))}
			>
				Continue Game
			</button>
		</div>
	</section>

	{#if latestGames.length != 0}
		<Accordion expanded={true}>
			<h2 slot="title" class="w-full text-center text-lg font-bold">
				Latest Game of the Day Scores
			</h2>
			<p class="w-full pb-2 text-center">
				Can you beat their times? Click on an entry to try the same game!
			</p>
			<table class="mx-auto mt-1 w-full max-w-lg table-fixed border-collapse font-mono">
				<thead>
					<tr class="border-b border-surface-300-700 text-lg">
						<th class="pl-2 text-left">NAME</th>
						<th class="text-center">GAME DATE</th>
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
							<td class="text-center">{reformatDateSeed(entry.game_id)}</td>
							<td class="pr-2 text-right">{millisecondsToTimeString(entry.time_ms)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</Accordion>
	{/if}

	<Accordion class="flex flex-col gap-2">
		<h2 slot="title" class="w-full text-center text-lg font-bold">How to Play</h2>
		<p>
			Voronoi Sweeper is a variation of the classic puzzle game Minesweeper. All of the same
			gameplay mechanics apply.
		</p>
		<p>
			The goal of the game is to reveal all of the safe cells on the board as quickly as possible
			without revealing any mines. Revealing a safe cell will show the number of neighboring mines.
			Cells are considered neighbors if they share any corner. If a cell is revealed to be a mine,
			the game is over and you lose. To help keep track of mine cells, you can flag cells (coloring
			them red) to mark them as suspected mines. Flagged cells can not be revealed, but may be
			unflagged at any time. If you reveal all of the non-mine cells on the board, you win the game
			and can submit your time to the leaderboard.
		</p>
		<p>
			The number of remaining mines is shown above the board at the top left. This is equal to the
			number of mines on the board minus the number of flagged cells. Note that incorrect flags will
			still reduce the mine count, and you do not need to flag the mines to win.
		</p>
		<p>
			The timer for the game is shown above the board at the top right. It starts as soon as you
			start interacting with the board, and stops when you win or lose.
		</p>
		<p>
			The emoticon face in the middle is a throwback to Minesweeper and is just for fun, reacting to
			your activity as you play the game. Unlike traditional Minesweeper, clicking the face will not
			reset the game.
		</p>
		<p>
			Game progress is saved automatically, and you can resume your most recent game with the
			"Continue Game" button above.
		</p>
		<p>
			You can share the current game by sharing the URL. The "Share Link" button at the bottom of
			the game page will copy the URL to your clipboard.
		</p>
		<p>
			The mines are set during board generation, so there is no guarantee that the first cell you
			click won't be a mine. If you are unlucky enough to get a mine on the first try, you can
			refresh the page to try again, or just generate a brand new game. There is also no guarantee
			that games are always solveable without guessing.
		</p>
		<p>Enjoy! And let me know if you find any bugs or fun seeds.</p>
	</Accordion>

	<Accordion>
		<h2 slot="title" class="w-full text-center text-lg font-bold">Controls</h2>
		<ul class="list-outside list-disc pl-6">
			<li>Click a cell to reveal it.</li>
			<li>
				Right click or click with flagging toggled on (using the "Flag" button) to flag a cell.
			</li>
			<li>
				Hover over a cell with the mouse cursor to highlight that cell's neighbors. Press and hold
				to highlight on mobile, but note that releasing will also click the cell.
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
	</Accordion>

	<Accordion>
		<h2 slot="title" class="w-full text-center text-lg font-bold">Try It Out</h2>
		<div class="flex w-full flex-col justify-between gap-8 overflow-clip sm:flex-row">
			<div class="flex flex-col gap-2">
				<p>
					Sometimes the best way to learn is to practice with a mini version. Try out the sample
					game
					<span class="inline sm:hidden">below</span>
					<span class="hidden sm:inline">to the right</span>
					to get a feel for the mechanics.
				</p>
				<p>
					Try clicking the cell in the center of the board. In this game it happens to be a 0-cell,
					meaning it doesn't have any neighboring mines. As such, the board will automatically
					expand the revealed area until it reaches cells with neighboring mines.
				</p>
				<p>
					From there, try to deduce which cells must be mines and which must be safe based on the
					numbers revealed. The following strageties will help:
				</p>
				<ul class="list-outside list-disc pl-6">
					<li>
						If a cell has as many unrevealed neighbor cells as its number, all of the unrevealed
						neighbor cells must be mines (eg: a 1-cell with one unrevealed neighbor).
					</li>
					<li>
						If a cell has as many neighboring flags as its number, all of the remaining unvrevealed
						neighbors must be safe (eg: a 1-cell with one flagged neighbor and one unflagged
						neighbor).
					</li>
				</ul>
				<p>
					If you need to try again, just refresh the page to restart the game. This demo won't save
					your progress like the normal game does.
				</p>
			</div>
			<div class="w-fit self-center overflow-clip sm:mx-auto">
				<Board
					seed="demo"
					boardHeight={5}
					boardWidth={5}
					onWin={() => {}}
					showSeed={false}
					saveProgress={false}
				/>
			</div>
		</div>
	</Accordion>

	<Accordion>
		<h2 slot="title" class="w-full text-center text-lg font-bold">
			Why is it called Voronoi Sweeper?
		</h2>
		<p>
			Voronoi Sweeper is a generalized implementation of Minesweeper, hence the "Sweeper" part of
			the name. "Voronoi" comes from the method used to generate the board. Instead of using a full
			grid of square cells like traditional Minesweeper, it partitions the board into convex cells
			using a
			<a
				href="https://en.wikipedia.org/wiki/Voronoi_diagram"
				target="_blank"
				class="text-blue-500 underline"
			>
				Voronoi diagram
			</a>
			formed from a pseudo-randomly selected set of points within the board. This allows for a wider variety
			of connection patterns between neighboring cells. It is possible for the board generation to create
			a full grid of square cells (see examples below). This makes Voronoi Sweeper a superset of Minesweeper.
		</p>
	</Accordion>

	<Accordion>
		<h2 slot="title" class="w-full text-center text-lg font-bold">Interesting Seeds</h2>
		<ul class="list-outside list-disc pl-6">
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
	</Accordion>
</div>
