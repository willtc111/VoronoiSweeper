<script lang="ts">
	export let value: string;
	export let shownValue = value;

	let copied: boolean = false;
	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(value);
			// Show "Copied" indicator for 2 seconds
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}
</script>

<button {...$$props} on:click={copyToClipboard}>
	{copied ? "Copied" : String(shownValue)}
</button>
