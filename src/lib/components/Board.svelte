<script lang="ts">
  import {Deck, Layer, OrthographicView} from '@deck.gl/core';
  import {PathLayer, PolygonLayer, TextLayer} from '@deck.gl/layers';
  import { mulberry32, seedToHash, type RNG } from "$lib/Random";
  import { onMount } from 'svelte';
  import { createBoard, type Board, type SweeperCell, type VoronoiCell } from '$lib/Board';

  export let boardWidth: number = 15;
  export let boardHeight: number = 15;
  let cellSize = 40;
  $: canvasWidth = cellSize * boardWidth;
  $: canvasHeight = cellSize * boardHeight;

  export let seed: string;

  let canvas: HTMLCanvasElement;
  let deck: Deck<OrthographicView>;

  let drawBoardBorder: boolean = false;
  let drawConnections: boolean = false;

  let board: Board;
  let hoverCellIndex: number | undefined = undefined;
  let neighborCellIndices: number[] = [];

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
  const connectionColor: Color = [255,255,255,100];

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
      controller: true,
      initialViewState: {
        target: [
          (boardWidth / 2) - 0.5,
          (boardHeight / 2) - 0.5,
          0
        ],
        zoom: Math.log2(canvasWidth / boardWidth),
        minZoom: Math.log2(canvasWidth / boardWidth)-2,
        maxZoom: 10
      },
      views: new OrthographicView(),
    });
  }

  function updateLayers() {
    if (!deck || !board) {
      return;
    }

    let layers: Layer[] = [];

    layers.push(new PolygonLayer<SweeperCell>({
      data: board.cells,
      getPolygon: (c: SweeperCell) => c.border,
      getFillColor: (c: SweeperCell) => getCellColor(c),
      getLineWidth: 0,
      lineWidthUnits: 'pixels',
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
        if (info.object) {
          // Flag with right click, reveal with left click
          console.log(event);
          if (event?.rightButton) {
            flagCell(info.object.index);
          } else {
            clickCell(info.object.index);
          }
        }
      },
      updateTriggers: {
        getFillColor: [hoverCellIndex, neighborCellIndices, board.cells.map(c => c.isRevealed), board.cells.map(c => c.isFlagged) ]
      }
    }));
    layers.push(new PathLayer<SweeperCell>({
      data: board.cells,
      getPath: (c: SweeperCell) => c.border,
      getColor: (c: SweeperCell) => borderColor,
      getWidth: 3,
      widthUnits: 'pixels',
      jointRounded: true,
    }));

    if (drawConnections) {
      // Draw connections between neighbors
      type LineData = {positions: [number, number][]};
      let connectionLines: LineData[] = [];
      for (let cell of board.cells) {
        for (let iNeighbor of cell.neighbors) {
          let neighbor = board.cells[iNeighbor];
          connectionLines.push({positions: [
            [
              cell.position[0] + 0.075,
              cell.position[1] + 0.025
            ],
            [
              neighbor.position[0] - 0.05,
              neighbor.position[1] - 0.05
            ]]});
        }
      }
      layers.push(new PathLayer<LineData>({
        data: connectionLines,
        getPath: (d: LineData) => d.positions,
        getColor: connectionColor,
        getWidth: 1,
        widthUnits: 'pixels',
      }));
    }

    layers.push(new TextLayer<SweeperCell>({
      data: board.cells.filter(c => c.isRevealed && (c.isMine || c.neighborMines > 0)),
      getPosition: (c: SweeperCell) => c.position,
      getText: (c: SweeperCell) => `${c.isMine ? "M" : c.neighborMines}`,
      getSize: (c: SweeperCell) => hoverCellIndex == c.index ? 24 : 18,
      sizeUnits: 'pixels',
      getColor: (c: SweeperCell) => c.isMine ? [0, 0, 0, 255] : numberColors[c.neighborMines - 1],
      updateTriggers: {
        getSize: [hoverCellIndex, neighborCellIndices]
      }
    }));

    if (drawBoardBorder) {
      type LineData = {positions: [number, number][]};
      let border = {positions: [
        [-0.5, -0.50],
        [boardWidth-0.5, 0-0.5],
        [boardWidth-0.5, boardHeight-0.5],
        [0-0.5, boardHeight-0.5],
        [0-0.5, 0-0.5]
      ]};
      layers.push(new PathLayer<LineData>({
        data: [border],
        getPath: (d: LineData) => d.positions,
        getColor: [0, 0, 0, 255],
        getWidth: 3,
        widthUnits: 'pixels',
      }));
    }

    deck.setProps({
      layers: layers
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

  function flagCell(index: number) {
    if (gameOver) {
      return;
    }
    let cell = board.cells[index];
    if (cell.isRevealed) {
      return;
    }
    cell.isFlagged = !cell.isFlagged;
    board.flagCount += cell.isFlagged ? 1 : -1;
    updateLayers();
  }

  function clickCell(index: number, isExpand:boolean = false) {
    if (gameOver) {
      return;
    }
    let cell = board.cells[index];
    if (cell.isFlagged || cell.isRevealed) {
      return;
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
      gameOver = true;
      isWin = true;
      for (let c of board.cells) {
        if (c.isMine && !c.isFlagged) {
          c.isFlagged = true;
          board.flagCount += 1;
        }
      }
      clearInterval(timerInterval);
    }

    // Only update the layers after the full possible expansion
    if (!isExpand) {
      updateLayers();
    }
  }

  // Game clock
  const startTime = Date.now();
  let timer: number = 0;
  let timerInterval: NodeJS.Timeout | undefined;

  // Cell and mine count modifiers
  let density: number;
  let danger: number;

  onMount(() => {
    let random: RNG = mulberry32(seedToHash(seed));
    density = 0.3 + (0.7 * random()); // Percentage of grid points to make into cells (1 = normal minesweeper)
    danger = 0.15 + (0.1 * random()); // Percentage of cells to make into mines
    let cellCount = Math.ceil(boardWidth * boardHeight * density);
    let mineCount = Math.ceil(cellCount * danger);
    board = createBoard(boardWidth, boardHeight, cellCount, mineCount, random);

    createDeck();
    updateLayers();
    timerInterval = setInterval(() => {
      timer = Date.now() - startTime;
    }, 1000/4);
  });

  function millisecondsToTimeString(ms: number): string {
    let totalSeconds = Math.floor(ms / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function getCssRgbString(color: Color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }

  $: canvasEdgeColor = getCssRgbString(gameOver ? (isWin ? [0,255,0,255] : [255,0,0,255]) : borderColor);
</script>

<div class="flex flex-col gap-2">
  <!-- Header -->
  <div class="flex justify-between">
    <span>{board?.mineCount - board?.flagCount}</span>
    <span>:)</span>
    <span>{millisecondsToTimeString(timer)}</span>
  </div>

  <!-- Canvas -->
  <div
    role="region"
    class="box-content border-3"
    style="width: {canvasWidth}px; height: {canvasHeight}px; border-color: {canvasEdgeColor};"
    on:mouseleave={() => {
      hoverCellIndex = undefined;
      neighborCellIndices = [];
      updateLayers();
    }}
  >
    <canvas
      class="w-full h-full block"
      style="background-color: rgb({borderColor[0]}, {borderColor[1]}, {borderColor[2]}, {borderColor[3]/255});"
      bind:this={canvas}
      on:contextmenu|preventDefault
    ></canvas>
  </div>

  <!-- Controls -->
  <div class="flex justify-between">
    <div>
      <label>
        <input type="checkbox" bind:checked={drawBoardBorder} on:change={updateLayers} />
        Draw Board Border
      </label>
      <label>
        <input type="checkbox" bind:checked={drawConnections} on:change={updateLayers} />
        Draw Connections
      </label>
    </div>

    {#if gameOver}
      <span>You {isWin ? "Win!" : "Lose!"}</span>
    {/if}

    <!-- {#if hoverCellIndex != undefined}
      <span class="px-2">Cell {hoverCellIndex}</span>
    {/if} -->
  </div>

  <!-- Debug Info -->
  <span>Density: {density}</span>
  <span>Danger: {danger}</span>
  <div class="flex gap-1 bg-gray-300">
    <span>Colors</span>
    {#each numberColors as color, index}
      <span
        class="font-bold"
        style="color: rgba({color[0]}, {color[1]}, {color[2]}, {color[3]/255});"
        title="Number {index + 1}"
      >{index+1}</span>
    {/each}
  </div>
</div>