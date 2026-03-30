<script lang="ts">
	import { Deck, Layer, OrthographicView } from "@deck.gl/core";
	import { PathLayer, PolygonLayer, TextLayer } from "@deck.gl/layers";
	import { mulberry32, seedToHash, type RNG } from "$lib/Random";
	import { onMount } from "svelte";
	import { clearSave, createBoard, type Board, type SweeperCell } from "$lib/Board";
	import { browser } from "$app/environment";
	import { millisecondsToTimeString } from "$lib/conversions";
	import Copyable from "$lib/components/Copyable.svelte";
	import { page } from "$app/stores";

	export let boardWidth: number = 15;
	export let boardHeight: number = 15;
	let cellSize = 40;
	$: canvasWidth = Math.min(browser ? window?.innerWidth - 20 : 1, cellSize * boardWidth);
	$: canvasHeight = Math.min(canvasWidth * (boardHeight / boardWidth), cellSize * boardHeight);

	export let seed: string;
	export let onWin: (time: number) => void;

	let canvas: HTMLCanvasElement;
	let deck: Deck<OrthographicView>;

	let drawConnections: boolean = false;

	let board: Board;
	let hoverCellIndex: number | undefined = undefined;
	let neighborCellIndices: number[] = [];
	let flagging: boolean = false; // Force all clicks to be flag clicks

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
	const connectionColor: Color = [255, 255, 255, 100];

	let gameOver: boolean = false;
	let isWin: boolean = true;

	function createDeck() {
		if (deck) {
			deck.finalize();
		}

		deck = new Deck<OrthographicView>({
			canvas: canvas,
			width: canvasWidth,
			height: canvasHeight,
			controller: {
				doubleClickZoom: false,
			},
			initialViewState: {
				target: [boardWidth / 2 - 0.5, boardHeight / 2 - 0.5, 0],
				zoom: Math.log2(canvasWidth / boardWidth),
				minZoom: Math.log2(canvasWidth / boardWidth) - 2,
				maxZoom: 10,
			},
			views: new OrthographicView(),
			getCursor: ({ isDragging }) => (isDragging ? "grabbing" : "pointer"),
		});
	}

	function updateLayers() {
		if (!deck || !board) {
			return;
		}

		let layers: Layer[] = [];

		layers.push(
			new PolygonLayer<SweeperCell>({
				data: board.cells,
				getPolygon: (c: SweeperCell) => c.border,
				getFillColor: (c: SweeperCell) => getCellColor(c),
				getLineWidth: 0,
				lineWidthUnits: "pixels",
				pickable: true,
				onHover: (info, event) => {
					if (info.object) {
						neighborCellIndices = info.object.neighbors;
						hoverCellIndex = info.object.index;
					} else {
						neighborCellIndices = [];
						hoverCellIndex = undefined;
					}
					updateLayers();
				},
				onClick: (info, event) => {
					const e = event.srcEvent as PointerEvent;
					if (info.object) {
						// Flag with right click, reveal with left click
						if (e.button == 2) {
							flagCell(info.object.index);
						} else {
							clickCell(info.object.index);
						}
					}
				},
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
		layers.push(
			new PathLayer<SweeperCell>({
				data: board.cells,
				getPath: (c: SweeperCell) => c.border,
				getColor: (c: SweeperCell) => borderColor,
				getWidth: 3,
				widthUnits: "pixels",
				jointRounded: true,
			})
		);

		if (drawConnections) {
			// Draw connections between neighbors
			type LineData = { positions: [number, number][] };
			let connectionLines: LineData[] = [];
			for (let cell of board.cells) {
				for (let iNeighbor of cell.neighbors) {
					let neighbor = board.cells[iNeighbor];
					connectionLines.push({
						positions: [
							[cell.position[0] + 0.075, cell.position[1] + 0.025],
							[neighbor.position[0] - 0.05, neighbor.position[1] - 0.05],
						],
					});
				}
			}
			layers.push(
				new PathLayer<LineData>({
					data: connectionLines,
					getPath: (d: LineData) => d.positions,
					getColor: connectionColor,
					getWidth: 1,
					widthUnits: "pixels",
				})
			);
		}

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
		let cell = board.cells[index];
		if (cell.isRevealed) {
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

		if (timerInterval == undefined) {
			// Start the timer on the first click
			timerInterval = setInterval(() => {
				timer = Date.now() - startTime;
			}, 1000 / 4);
		}

		if (flagging) {
			flagCell(index, fromSave);
			return;
		}

		let cell = board.cells[index];
		if (cell.isFlagged || cell.isRevealed) {
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

	// Game clock
	let startTime = Date.now();
	let timer: number = 0;
	let timerInterval: NodeJS.Timeout | undefined = undefined;

	// Cell and mine count modifiers
	let density: number;
	let danger: number;

	onMount(() => {
		let random: RNG = mulberry32(seedToHash(seed));
		density = 0.3 + 0.7 * random(); // Percentage of grid points to make into cells (1 = normal minesweeper)
		danger = 0.15 + 0.1 * random(); // Percentage of cells to make into mines
		let cellCount = Math.ceil(boardWidth * boardHeight * density);
		let mineCount = Math.ceil(cellCount * danger);
		board = createBoard(boardWidth, boardHeight, cellCount, mineCount, random);
		loadSave();

		createDeck();
		updateLayers();
	});

	function getCssRgbString(color: Color) {
		return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
	}

	$: canvasEdgeColor = getCssRgbString(
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
		></canvas>
	</div>

	<!-- Debug Info -->
	<div class="flex flex-row justify-between">
		<div class="flex flex-col gap-1">
			<span title="Game seed, click to copy">
				<b>Seed:</b>
				<Copyable value={seed}/>
			</span>
			<Copyable
				class="btn bg-primary-500 w-32"
				value={$page.url.href}
				shownValue={"Share Link"}
			/>
			<span title="Determines the number of cells"><b>Density:</b> {density?.toFixed(3)}</span>
			<span title="Determines the number of mines"><b>Danger:</b> {danger?.toFixed(3)}</span>
		</div>
		{#if gameOver}
			<span class="text-xl mr-1">You {isWin ? "Win!" : "Lose!"}</span>
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

	<!-- <span><b>Max Mines:</b> {board?.cells?.filter(c => !c.isMine).map(c => c.neighborMines).sort().reverse()[0]}</span> -->
</div>
