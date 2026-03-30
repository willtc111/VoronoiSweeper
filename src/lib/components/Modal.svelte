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
		transition:fly={{ y: -200, duration: 200 }}
		class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs"
	>
		<section
			on:click|stopPropagation
			class="rounded-lg border-3 border-surface-50-950 bg-surface-200-800 shadow-xl"
		>
			<header class="flex justify-between gap-16 border-b-3 border-surface-50-950 px-8 py-3">
				<h2 class="text-2xl font-bold">
					{modalTitle}
				</h2>
				<button
					on:click={closeModal}
					on:keydown={(e) => e.key === "Enter" && closeModal()}
					class="btn bg-surface-500"
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
