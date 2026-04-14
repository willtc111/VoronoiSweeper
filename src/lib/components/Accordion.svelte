<script lang="ts">
	import { onMount } from "svelte";
	import { slide } from "svelte/transition";

	export let expanded = false;

	let isEmpty = false;
	onMount(() => {
		isEmpty = !$$slots.default;
	});
</script>

<section
	class="w-full rounded-3xl border-2 border-surface-500 p-3 shadow-md shadow-black/50 dark:shadow-black"
>
	<button on:click={() => (expanded = !expanded)} class="flex w-full gap-2 text-lg select-none">
		<span class="mt-1">
			{#if isEmpty}
				<svg
					height="24px"
					width="24px"
					viewBox="-25 -25 50 50"
					class="fill-surface-950-50"
					xmlns="http://www.w3.org/2000/svg"
				>
					<circle r="15%" />
				</svg>
			{:else if expanded}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					height="24px"
					width="24px"
					class="fill-surface-950-50"
					viewBox="0 -960 960 960"
					><path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" /></svg
				>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					height="24px"
					width="24px"
					class="fill-surface-950-50"
					viewBox="0 -960 960 960"
					><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" /></svg
				>
			{/if}
		</span>

		<slot name="title" />
	</button>

	{#if expanded}
		<div
			transition:slide={{ duration: 300 }}
			class="overflow-hidden"
			on:introstart={(e) => e.currentTarget.classList.add("transitioning")}
			on:introend={(e) => e.currentTarget.classList.remove("transitioning")}
			on:outrostart={(e) => e.currentTarget.classList.add("transitioning")}
		>
			<div class="p-2 {$$props.class}">
				<slot />
			</div>
		</div>
	{/if}
</section>

<style>
	.transitioning :global(canvas) {
		visibility: hidden;
	}
</style>
