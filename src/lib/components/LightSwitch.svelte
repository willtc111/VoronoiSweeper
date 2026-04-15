<script lang="ts">
	import { onMount } from "svelte";

	/**
	 * Is the light switch menu open
	 */
	let open: boolean = false;

	/**
	 * Store the mode for button toggling
	 */
	let mode: string | undefined;

	onMount(() => {
		mode = localStorage.getItem("mode") || undefined;
		applyMode();
	});

	function changeMode(newMode: string | undefined = undefined) {
		mode = newMode;
		if (mode == undefined) {
			localStorage.removeItem("mode");
		} else {
			localStorage.setItem("mode", mode);
		}
		applyMode();
		open = false;
	}

	function applyMode() {
		let isDark: boolean =
			localStorage.mode === "dark" ||
			(!("mode" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);

		document.documentElement.setAttribute("data-mode", isDark ? "dark" : "light");
	}
</script>

<svelte:head>
	<script>
		document.documentElement.setAttribute(
			"data-mode",
			localStorage.mode === "dark" ||
				(!("mode" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
				? "dark"
				: "light"
		);
	</script>
</svelte:head>

<div class="relative h-8 w-8">
	<button
		class="btn h-8 w-8 preset-filled-surface-200-800 {open ? 'rounded-b-none' : ''}"
		onclick={() => (open = !open)}
	>
		&#x1F4A1;
	</button>

	{#if open}
		<section
			class="absolute top-full right-0 z-50 btn-group preset-filled-surface-200-800 {open
				? 'rounded-tr-none'
				: ''} w-fit flex-col gap-1 p-2"
		>
			<button onclick={() => changeMode("dark")} disabled={mode == "dark"}> Dark </button>
			<button onclick={() => changeMode("light")} disabled={mode == "light"}> Light </button>
			<button onclick={() => changeMode()} disabled={mode == undefined}> Default </button>
		</section>
	{/if}
</div>

<style>
	section > button {
		@apply btn w-full preset-filled-surface-500 btn-sm;
	}
</style>
