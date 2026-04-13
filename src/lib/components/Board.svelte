<script lang="ts">
	import { Deck, Layer, OrthographicView } from "@deck.gl/core";
	import { PolygonLayer, TextLayer } from "@deck.gl/layers";
	import { mulberry32, seedToHash, type RNG } from "$lib/Random";
	import { onMount } from "svelte";
	import { clearSave, createBoard, type Board, type SweeperCell } from "$lib/Board";
	import { browser } from "$app/environment";
	import { millisecondsToTimeString } from "$lib/conversions";
	import Copyable from "$lib/components/Copyable.svelte";
	import { page } from "$app/stores";

	export let seed: string;
	export let onWin: (time: number) => void;

	export let boardWidth: number = 15;
	export let boardHeight: number = 15;

	const cellSize = 40;
	$: canvasWidth = Math.min(browser ? window?.innerWidth - 20 : 1, cellSize * boardWidth);
	$: canvasHeight = Math.min(canvasWidth * (boardHeight / boardWidth), cellSize * boardHeight);

	let canvas: HTMLCanvasElement;
	let deck: Deck<OrthographicView>;

	/**
	 * The game board
	 */
	let board: Board;
	/**
	 * The index of the current hovered cell, or undefined if not hovering over any cell
	 */
	let hoverCellIndex: number | undefined = undefined;
	/**
	 * The indices of the neighbors of the currently hovered cell
	 */
	let neighborCellIndices: number[] = [];
	/**
	 * Whether flagging mode is active (making all clicks flag clicks)
	 */
	let flagging: boolean = false;
	/**
	 * Is the game over
	 */
	let gameOver: boolean = false;
	/**
	 * Is the game won (only relevant if gameOver is true)
	 */
	let isWin: boolean = true;

	/**
	 * Time the game was started
	 */
	let startTime: number | undefined = undefined;
	/**
	 * Milliseconds since the game was started
	 */
	let timer: number = 0;
	/**
	 * Interval for updating the game timer
	 */
	let timerInterval: NodeJS.Timeout | undefined = undefined;

	/**
	 * Percentage of the grid points to make into cells (1 means a full grid, like traditional minesweeper)
	 */
	let density: number;
	/**
	 * The percentage of cells to make into mines (relative to the number of cells, not the total grid size)
	 */
	let danger: number;

	onMount(() => {
		let random: RNG = mulberry32(seedToHash(seed));
		density = 0.3 + 0.7 * random();
		danger = 0.15 + 0.1 * random();
		let cellCount = Math.ceil(boardWidth * boardHeight * density);
		let mineCount = Math.ceil(cellCount * danger);
		board = createBoard(boardWidth, boardHeight, cellCount, mineCount, random);
		loadSave();

		createDeck();
		updateLayers();

		timerInterval = setInterval(() => {
			if (startTime != undefined) {
				timer = Date.now() - startTime;
			}
		}, 1000 / 4);
	});

	$: canvasEdgeColor = colorToCssRgbString(
		gameOver ? (isWin ? [0, 255, 0, 255] : [255, 0, 0, 255]) : borderColor
	);

	let face = ":)";
	$: {
		if (gameOver) {
			face = isWin ? "B)" : ":(";
		} else if (hoverCellIndex != undefined && !board.cells[hoverCellIndex].isRevealed) {
			face = ":o";
		} else {
			face = ":)";
		}
	}

	type Color = [number, number, number, number];
	const numberColors: Color[] = [
		[0, 0, 255, 255],
		[0, 128, 0, 255],
		[255, 0, 0, 255],
		[0, 0, 128, 255],
		[128, 0, 0, 255],
		[0, 128, 128, 255],
		[0, 0, 0, 255],
		[128, 128, 0, 255],
	];
	const borderColor: Color = [125, 125, 125, 255];
	const explodedMineColor: Color = [255, 0, 0, 255];
	const flaggedColor: Color = [255, 120, 120, 255];
	const revealedColor: Color = [220, 220, 220, 255];
	const hoverColor: Color = [150, 150, 150, 255];
	const hoverFlaggedColor: Color = [225, 80, 80, 255];
	const neighborFlaggedColor: Color = [220, 150, 80, 255];
	const neighborHoverColor: Color = [185, 185, 165, 255];
	const hiddenColor: Color = [200, 200, 200, 255];

	function colorToCssRgbString(color: Color) {
		return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
	}

	function createDeck() {
		if (deck) {
			deck.finalize();
		}

		deck = new Deck<OrthographicView>({
			canvas: canvas,
			width: canvasWidth,
			height: canvasHeight,
			controller: false,
			initialViewState: {
				target: [boardWidth / 2 - 0.5, boardHeight / 2 - 0.5, 0],
				zoom: Math.log2(canvasWidth / boardWidth),
				minZoom: Math.log2(canvasWidth / boardWidth) - 2,
				maxZoom: 10,
			},
			views: new OrthographicView(),
			getCursor: () => "pointer",
			onClick: () => {}, // disable default click handler
		});
	}

	function onPointerUp(e: PointerEvent) {
		const { offsetX: x, offsetY: y } = e;
		const info = deck.pickObject({ x, y, radius: 1 });

		// Flag with right click, reveal with left click
		if (info != null) {
			if (e.button == 2) {
				flagCell(info.index);
			} else {
				clickCell(info.index);
			}
		}
	}

	function onHover(e: PointerEvent) {
		const { offsetX: x, offsetY: y } = e;
		const info = deck.pickObject({ x, y, radius: 1 });
		const object: SweeperCell | null = info?.object ?? null;

		if (object != null) {
			neighborCellIndices = object.neighbors;
			hoverCellIndex = object.index;
		} else {
			neighborCellIndices = [];
			hoverCellIndex = undefined;
		}
		updateLayers();
	}

	function updateLayers() {
		if (!deck || !board) {
			return;
		}

		let layers: Layer[] = [];

		// Cells
		layers.push(
			new PolygonLayer<SweeperCell>({
				data: board.cells,
				getPolygon: (c: SweeperCell) => c.border,
				getFillColor: (c: SweeperCell) => getCellColor(c),
				getLineWidth: 3,
				getLineColor: borderColor,
				lineJointRounded: true,
				lineWidthUnits: "pixels",
				pickable: true,
				updateTriggers: {
					getFillColor: [
						hoverCellIndex,
						neighborCellIndices,
						board.cells.map((c) => c.isRevealed),
						board.cells.map((c) => c.isFlagged),
					],
				},
			})
		);

		// Cell labels
		layers.push(
			new TextLayer<SweeperCell>({
				data: board.cells.filter((c) => c.isRevealed && (c.isMine || c.neighborMines > 0)),
				getPosition: (c: SweeperCell) => c.position,
				getText: (c: SweeperCell) => `${c.isMine ? "M" : c.neighborMines}`,
				getSize: (c: SweeperCell) => (hoverCellIndex == c.index ? 24 : 18),
				sizeUnits: "pixels",
				getColor: (c: SweeperCell) =>
					c.isMine ? [0, 0, 0, 255] : numberColors[c.neighborMines - 1],
				updateTriggers: {
					getSize: [hoverCellIndex, neighborCellIndices],
				},
			})
		);

		deck.setProps({
			layers: layers,
		});
	}

	function getCellColor(c: SweeperCell): [number, number, number, number] {
		if (c.isRevealed && c.isMine && !c.isFlagged) {
			return explodedMineColor;
		} else if (c.isRevealed) {
			return revealedColor;
		} else if (hoverCellIndex == c.index) {
			return c.isFlagged ? hoverFlaggedColor : hoverColor;
		} else if (neighborCellIndices.includes(c.index)) {
			return c.isFlagged ? neighborFlaggedColor : neighborHoverColor;
		} else {
			return c.isFlagged ? flaggedColor : hiddenColor;
		}
	}

	function flagCell(index: number, fromSave: boolean = false) {
		if (gameOver) {
			return;
		}

		if (startTime == undefined) {
			startTime = Date.now();
		}

		// Handle flag chording
		let cell = board.cells[index];
		if (cell.isRevealed) {
			// If the number of unflagged neighbors is equal to the remaining mine count, flag all remaining neighbors
			const flaggedNeighbors = cell.neighbors.reduce((count, iNeighbor) => {
				return count + (board.cells[iNeighbor].isFlagged ? 1 : 0);
			}, 0);
			const remainingMines = cell.neighborMines - flaggedNeighbors;
			const unflaggedNeighbors = cell.neighbors.filter(
				(iNeighbor) => !board.cells[iNeighbor].isFlagged && !board.cells[iNeighbor].isRevealed
			);
			if (unflaggedNeighbors.length == remainingMines) {
				for (let iNeighbor of unflaggedNeighbors) {
					let neighbor = board.cells[iNeighbor];
					flagCell(neighbor.index, true);
				}
				updateLayers();
			}
			return;
		}

		if (!fromSave) {
			addToSave(index, true);
		}

		cell.isFlagged = !cell.isFlagged;
		board.flagCount += cell.isFlagged ? 1 : -1;
		updateLayers();
	}

	function clickCell(index: number, isExpand: boolean = false, fromSave: boolean = false) {
		if (gameOver) {
			return;
		}

		if (startTime == undefined) {
			startTime = Date.now();
		}

		if (flagging) {
			flagCell(index, fromSave);
			return;
		}

		const cell = board.cells[index];
		if (cell.isFlagged) {
			// Can't click a flagged cell
			return;
		}

		if (cell.isRevealed) {
			// If the number of flagged neighbors is equal to cell value, reveal all remaining neighbors
			const neighborFlags = cell.neighbors.reduce((count, iNeighbor) => {
				return count + (board.cells[iNeighbor].isFlagged ? 1 : 0);
			}, 0);

			if (neighborFlags == cell.neighborMines) {
				for (let iNeighbor of cell.neighbors) {
					let neighbor = board.cells[iNeighbor];
					if (!neighbor.isFlagged && !neighbor.isRevealed) {
						clickCell(neighbor.index, true);
					}
				}
				updateLayers();
			}
			return;
		}

		if (!isExpand && !fromSave) {
			addToSave(index, false);
		}

		cell.isRevealed = true;
		if (cell.isMine) {
			// Game over
			for (let c of board.cells) {
				if (c.isMine) {
					c.isRevealed = true;
				}
			}
			gameOver = true;
			isWin = false;
			clearInterval(timerInterval);
			timerInterval = undefined;
			updateLayers();
			clearSave();
			return;
		}

		// Automatically expand revealed area for 0s
		if (cell.neighborMines == 0 && !cell.isMine) {
			for (let iNeighbor of cell.neighbors) {
				let neighbor = board.cells[iNeighbor];
				if (!neighbor.isFlagged && !neighbor.isRevealed && !neighbor.isMine) {
					clickCell(neighbor.index, true);
				}
			}
		}
		board.safeCount += 1;

		if (board.safeCount == board.cells.length - board.mineCount) {
			// Player has won
			clearInterval(timerInterval);
			timerInterval = undefined;
			gameOver = true;
			isWin = true;
			for (let c of board.cells) {
				if (c.isMine && !c.isFlagged) {
					c.isFlagged = true;
					board.flagCount += 1;
				}
			}
			updateLayers();

			onWin(timer);
		}

		// Only update the layers after the full possible expansion
		if (!isExpand) {
			updateLayers();
		}
	}

	type MoveRecord = {
		index: number;
		flag: boolean;
	};

	function addToSave(index: number, flag: boolean) {
		let steps: string = "";
		if (localStorage.getItem("saveSeed") != seed) {
			localStorage.setItem("saveSeed", seed);
			localStorage.setItem("saveStartTime", String(startTime));
		} else {
			steps = localStorage.getItem("saveSteps") ?? "";
		}
		if (steps.length != 0) {
			steps = steps + ", ";
		}
		steps = steps + JSON.stringify({ index, flag });
		localStorage.setItem("saveSteps", steps);
	}

	function loadSave() {
		if (localStorage.getItem("saveSeed") != seed) {
			// The current save is not for this game, or a save doesn't exist
			return;
		}
		startTime = Number(localStorage.getItem("saveStartTime") ?? Date.now());
		timer = Date.now() - startTime;
		let steps: MoveRecord[] = JSON.parse(`[${localStorage.getItem("saveSteps") ?? ""}]`);
		for (let step of steps) {
			if (step.flag) {
				flagCell(step.index, true);
			} else {
				clickCell(step.index, false, true);
			}
		}
	}
</script>

<div class="flex flex-col gap-2 py-2">
	<!-- Header -->
	<div class="grid grid-cols-3">
		<span class="px-2" title="Mines remaining">
			{board != undefined ? board?.mineCount - board?.flagCount : ""}
		</span>
		<span class="px-2 text-center">
			{face}
		</span>
		<span class="px-2 text-right" title="Elapsed time">
			{millisecondsToTimeString(timer)}
		</span>
	</div>

	<!-- Canvas -->
	<div
		role="region"
		class="mx-auto box-content border-3"
		style="width: {canvasWidth}px; height: {canvasHeight}px; border-color: {canvasEdgeColor};"
		on:mouseleave={() => {
			hoverCellIndex = undefined;
			neighborCellIndices = [];
			updateLayers();
		}}
	>
		<canvas
			class="block h-full w-full"
			style="background-color: rgb({borderColor[0]}, {borderColor[1]}, {borderColor[2]}, {borderColor[3] /
				255});"
			bind:this={canvas}
			on:contextmenu|preventDefault
			on:pointerup={onPointerUp}
			on:pointermove={onHover}
		></canvas>
	</div>

	<!-- Info & Controls -->
	<div class="flex flex-row justify-between">
		<div class="flex flex-col gap-1">
			<span title="Game seed, click to copy">
				<b>Seed:</b>
				<Copyable value={seed} />
			</span>
			<Copyable
				class="btn w-32 preset-filled-primary-500"
				value={$page.url.href}
				shownValue={"Share Link"}
			/>
			<span title="Determines the number of cells"><b>Density:</b> {density?.toFixed(3)}</span>
			<span title="Determines the number of mines"><b>Danger:</b> {danger?.toFixed(3)}</span>
		</div>
		{#if gameOver}
			<span class="mr-1 text-xl">You {isWin ? "Win!" : "Lose!"}</span>
		{:else}
			<button
				class="btn aspect-square h-full {flagging
					? 'preset-filled bg-error-950 text-error-50'
					: 'preset-filled-primary-500'}"
				on:click={() => (flagging = !flagging)}
			>
				Flag
			</button>
		{/if}
	</div>
</div>
