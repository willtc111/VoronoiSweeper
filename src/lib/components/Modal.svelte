<script lang="ts">
	import { fly } from "svelte/transition";

	let showModal = false;

	export function openModal() {
		showModal = true;
	}
	export let modalTitle: string = "";
	export let closeText: string = "X";
	export let disableClose: boolean = false;

	export function closeModal() {
		showModal = false;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
{#if showModal}
	<div
		on:click={closeModal}
		class="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-xs backdrop-brightness-80 dark:backdrop-brightness-110"
	>
		<section
			on:click|stopPropagation
			transition:fly={{ y: -200, duration: 200 }}
			class="rounded-lg bg-surface-50-950 shadow-xl"
		>
			<header class="relative px-8 pt-3 pb-2">
				<h2 class="w-full text-center text-2xl font-bold">
					{modalTitle}
				</h2>
				<button
					on:click={closeModal}
					on:keydown={(e) => e.key === "Enter" && closeModal()}
					class="absolute top-0 right-0 btn h-10 w-10"
					aria-label="Close Modal"
					disabled={disableClose}
				>
					{closeText}
				</button>
			</header>

			<slot />
		</section>
	</div>
{/if}
