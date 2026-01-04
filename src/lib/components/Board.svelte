<script lang="ts">
  import {Deck, Layer, OrthographicView} from '@deck.gl/core';
  import {PathLayer, PolygonLayer, ScatterplotLayer, TextLayer} from '@deck.gl/layers';
  import { mulberry32, seedToHash, type RNG } from "$lib/Random";
	import { onMount } from 'svelte';
	import { createBoard, type Board, type SweeperCell, type VoronoiCell } from '$lib/Board';

  export let boardWidth: number = 40;
  export let boardHeight: number = 30;
  let cellSize = 25;
  $: canvasWidth = cellSize * boardWidth;
  $: canvasHeight = cellSize * boardHeight;

  export let seed: string;
  let random: RNG = mulberry32(seedToHash(seed));

  let canvas: HTMLCanvasElement;
  let deck: Deck<OrthographicView>;

  let drawBoardBorder: boolean = true;
  let drawConnections: boolean = false;

  let board: Board;
  let hoverCellIndex: number | undefined = undefined;
  let neighborCellIndices: number[] = [];

  const numberColors = [
    [0, 0, 255, 255],
    [0, 128, 0, 255],
    [255, 0, 0, 255],
    [0, 0, 128, 255],
    [128, 0, 0, 255],
    [0, 128, 128, 255],
    [0, 0, 0, 255],
    [128, 128, 0, 255],
  ];

  function createDeck() {
    if (deck) {
      deck.finalize();
    }

    deck = new Deck<OrthographicView>({
      canvas: canvas,
      width: canvasWidth,
      height: canvasHeight,
      controller: true, // For debug only, set to false later
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

    // layers.push(new ScatterplotLayer({
    //   data: board.cells,
    //   getPosition: c => c.position,
    //   getFillColor: c => [
    //     c.position[0]/boardWidth * 255,
    //     0,
    //     c.position[1]/boardHeight * 255,
    //     255
    //   ],
    //   getRadius: 2,
    //   radiusUnits: 'pixels',
    //   pickable: true,
    //   onHover: (info, event) => {
    //     console.log('Look:', info?.object?.position);
    //   }
    // }));
    layers.push(new PolygonLayer<SweeperCell>({
      data: board.cells,
      getPolygon: (c: SweeperCell) => c.border,
      getFillColor: (c: SweeperCell) => {
        if (hoverCellIndex == c.index) {
          return [150, 150, 150, 255];
        } else if (neighborCellIndices.includes(c.index)) {
          return [185, 185, 165, 255];
        } else {
          return [200, 200, 200, 255]
        }
      },
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
      updateTriggers: {
        getFillColor: [hoverCellIndex, neighborCellIndices]
      }
    }));
    layers.push(new PathLayer<SweeperCell>({
      data: board.cells,
      getPath: (c: SweeperCell) => c.border,
      getColor: [125, 125, 125, 255],
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
          connectionLines.push({positions: [cell.position, neighbor.position]});
        }
      }
      layers.push(new PathLayer<LineData>({
        data: connectionLines,
        getPath: (d: LineData) => d.positions,
        getColor: [0, 0, 0, 50],
        getWidth: 1,
        widthUnits: 'pixels',
      }));
    }

    layers.push(new TextLayer<SweeperCell>({
      data: board.cells.filter(c => c.neighborMines > 0 && !c.isMine),
      getPosition: (c: SweeperCell) => c.position,
      getText: (c: SweeperCell) => `${c.neighborMines}`,
      getSize: (c: SweeperCell) => hoverCellIndex == c.index ? 24 : 18,
      sizeUnits: 'pixels',
      getColor: (c: SweeperCell) => numberColors[c.neighborMines - 1],
      updateTriggers: {
        getSize: [hoverCellIndex, neighborCellIndices]
      }
    }));

    if (drawBoardBorder) {
      // Border from (0,0) to (boardWidth, boardHeight)
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
        getColor: [0, 255, 0, 255],
        getWidth: 3,
        widthUnits: 'pixels',
      }));
    }

    deck.setProps({
      layers: layers
    });
  }

  onMount(() => {
    board = createBoard(boardWidth, boardHeight, 81, 10, random);
    createDeck();
    updateLayers();
  });
</script>

<!-- Canvas -->
<div class="flex flex-col gap-2">
  <div
    role="region"
    class="box-content border-2 border-gray-700"
    style="width: {canvasWidth}px; height: {canvasHeight}px;"
    on:mouseleave={() => {
      hoverCellIndex = undefined;
      neighborCellIndices = [];
      updateLayers();
    }}
  >
    <canvas
      class="bg-gray-100 w-full h-full block"
      bind:this={canvas}
    ></canvas>
  </div>

  <!-- Controls -->
  <div>
    <label>
      <input type="checkbox" bind:checked={drawBoardBorder} on:change={updateLayers} />
      Draw Board Border
    </label>
    
    <label>
      <input type="checkbox" bind:checked={drawConnections} on:change={updateLayers} />
      Draw Connections
    </label>

    {#if hoverCellIndex != undefined}
      <span class="px-2">Cell {hoverCellIndex}</span>
    {/if}
  </div>

  <!-- Debug Info -->
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