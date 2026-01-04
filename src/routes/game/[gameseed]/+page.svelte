<script lang="ts">
	import Board from '$lib/components/Board.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  const gameseed = data.gameseed;
</script>

<div class="w-full h-screen flex flex-col gap-2">
  <div class="w-full flex justify-between bg-gray-300 p-2">
    <a class="button" href="/">Home</a>
    <span>:o</span>
    <span><b>Seed:</b>{" "+gameseed}</span>
  </div>

  <div class="w-full flex justify-center">
    <Board seed={gameseed} />
  </div>
</div>