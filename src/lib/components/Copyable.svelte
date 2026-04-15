<script lang="ts">
	export let value: string;
	export let shownValue = value;
	export let copyMessage: string = "Copied";

	let copied: boolean = false;
	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(value);
			// Show copied message for 2 seconds
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
	{copied ? copyMessage : String(shownValue)}
</button>
