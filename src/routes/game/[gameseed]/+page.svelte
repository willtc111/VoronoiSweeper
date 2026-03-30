<script lang="ts">
	import { resolve } from "$app/paths";
	import { clearSave } from "$lib/Board";
	import Board from "$lib/components/Board.svelte";
	import LightSwitch from "$lib/components/LightSwitch.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import { millisecondsToTimeString } from "$lib/conversions";
	import { insertHighScore, postHighScore, type HighScore } from "$lib/Leaderboard";
	import { generateSeed } from "$lib/Random";
	import type { PageData } from "./$types";

	export let data: PageData;
	const gameseed = data.gameseed;
	const newGameUrl = resolve(`/game/${generateSeed()}`);

	let leaderboard: HighScore[] = data.leaderboard;

	let modalRef: Modal;
	let nameInput: HTMLInputElement;

	let newHighScore: number | undefined = undefined;
	let name = "";
	function onWin(time: number) {
		if (leaderboard.length >= 10 && time > leaderboard[leaderboard.length - 1].time_ms) {
			// Not a new high score, just show the leaderboard
			modalRef.openModal();
			return;
		}

		// Add the blank leaderboard entry
		newHighScore = time;
		leaderboard = insertHighScore(leaderboard, { time_ms: time, name: undefined });

		// Prompt the player to enter their initials
		showLeaderboard();
	}

	async function submitHighScore() {
		await postHighScore(gameseed, name, newHighScore!);

		// Update our local copy of the leaderboard
		leaderboard.find((entry) => entry.name === undefined)!.name = name.toUpperCase();

		// Stop submitting and erase the save
		newHighScore = undefined;
		clearSave();
	}

	function showLeaderboard() {
		modalRef.openModal();
		setTimeout(() => nameInput?.focus(), 200);
	}

	function getSuffix(num: number) {
		if (num % 10 === 1 && num % 100 !== 11) return "st";
		if (num % 10 === 2 && num % 100 !== 12) return "nd";
		if (num % 10 === 3 && num % 100 !== 13) return "rd";
		return "th";
	}
</script>

<title> Voronoi Sweeper </title>

<Modal
	modalTitle="Leaderboard"
	bind:this={modalRef}
>
	<div class="mx-8 my-4 w-92 font-mono text-lg">
		<table class="w-full border-collapse">
			<thead>
				<tr class="text-left text-xl">
					<th>RANK</th>
					<th>NAME</th>
					<th class="text-right">TIME</th>
				</tr>
			</thead>
			<tbody>
				{#each leaderboard as entry, rank}
					<tr>
						<td class="flex items-baseline">
							{rank + 1}
							<span class="text-sm">
								{getSuffix(rank + 1)}
							</span>
						</td>
						<td>
							{#if newHighScore != undefined && entry.name == undefined}
								<input
									type="text"
									bind:value={name}
									bind:this={nameInput}
									maxlength="3"
									class="w-full bg-transparent uppercase focus:outline-none"
									placeholder="___"
								/>
							{:else}
								{entry.name}
							{/if}
						</td>
						<td class="text-right">{millisecondsToTimeString(entry.time_ms)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if newHighScore != undefined}
			<div class="flex justify-center">
				<button
					class="btn preset-filled-primary-500 inset-x-auto"
					disabled={name.length != 3}
					on:click={() => {
						submitHighScore();
						modalRef.closeModal();
					}}
				>
					Submit
				</button>
			</div>
		{/if}
	</div>
</Modal>

<div class="flex h-screen flex-col">
	<!-- HEADER -->
	<div class="absolute right-0 p-2">
		<LightSwitch />
	</div>
	<div class="flex flex-col-reverse bg-surface-50-950 p-2 sm:grid sm:grid-cols-3">
		<div class="flex justify-center gap-2 sm:justify-start">
			<a class="btn preset-filled-primary-500" href={resolve("/")}> Home </a>
			<a class="btn preset-filled-primary-500" href={newGameUrl} data-sveltekit-reload>
				New Game
			</a>
			<button
				on:click={showLeaderboard}
				class="btn preset-filled-primary-500"
				title="Leaderboard"
			>
				<svg class="h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#e3e3e3"><path d="M280-120v-80h160v-124q-49-11-87.5-41.5T296-442q-75-9-125.5-65.5T120-640v-40q0-33 23.5-56.5T200-760h80v-80h400v80h80q33 0 56.5 23.5T840-680v40q0 76-50.5 132.5T664-442q-18 46-56.5 76.5T520-324v124h160v80H280Zm0-408v-152h-80v40q0 38 22 68.5t58 43.5Zm285 93q35-35 35-85v-240H360v240q0 50 35 85t85 35q50 0 85-35Zm115-93q36-13 58-43.5t22-68.5v-40h-80v152Zm-200-52Z"/></svg>
			</button>
		</div>

		<div class="grow text-center font-bold">Voronoi Sweeper</div>
	</div>

	<!-- GAME -->
	<div class="flex justify-center">
		<Board seed={gameseed} {onWin} />
	</div>
</div>
