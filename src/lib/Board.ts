import { angle_between, circumcircleCenter, clipPolygon, distance, type Point2D } from "./Geometry";
import { shuffle, type RNG } from "./Random";

type Point = {
	position: Point2D;
};

export type VoronoiCell = Point & {
	border: [number, number][];
	neighbors: number[];
};

export type SweeperCell = VoronoiCell & {
	index: number;
	isMine: boolean;
	isRevealed: boolean;
	isFlagged: boolean;
	neighborMines: number;
};

export type Board = {
	width: number;
	height: number;
	density: number;
	danger: number;
	flagCount: number;
	mineCount: number;
	safeCount: number;
	cells: SweeperCell[];
};

export const BOARD_SIZE = 15;

export class Triangle {
	indices: [number, number, number];
	circleCenter: Point2D;
	circleRadius: number;

	constructor(points: Point2D[], indices: [number, number, number]) {
		this.indices = indices;
		this.circleCenter = circumcircleCenter([
			points[indices[0]],
			points[indices[1]],
			points[indices[2]],
		]);
		this.circleRadius = distance(this.circleCenter, points[indices[0]]);
	}

	circle_contains(point: Point2D): boolean {
		return distance(this.circleCenter, point) <= this.circleRadius;
	}
}

export function createRandomBoard(width: number, height: number, random: RNG): Board {
	const density = 0.3 + 0.7 * random();
	const danger = 0.15 + 0.1 * random();
	const cellCount = Math.ceil(width * height * density);
	const mineCount = Math.ceil(cellCount * danger);
	return createBoard(width, height, cellCount, mineCount, random);
}

export function createBoard(
	width: number,
	height: number,
	cellCount: number,
	mineCount: number,
	random: RNG
): Board {
	if (cellCount < 3) {
		throw new Error("At least 3 cells are required to create a board");
	}
	if (cellCount > width * height) {
		throw new Error(`Not enough space on the ${width} x ${height}board for ${cellCount} cells`);
	}
	if (mineCount >= cellCount) {
		throw new Error("Number of mines must be less than number of cells");
	}
	if (mineCount < 1) {
		throw new Error("Number of mines must be at least 1");
	}

	// Create list of unique grid positions to avoid overlapping cells
	const maxOffset = 0;
	let gridPositions: [number, number][] = [...Array(height)].flatMap((_, y) =>
		[...Array(width)].map(
			(_, x) => [x + random() * maxOffset, y + random() * maxOffset] as [number, number]
		)
	);
	gridPositions = shuffle(gridPositions, random);

	// Select cell positions
	const points: Point2D[] = [];
	for (let i = 0; i < cellCount; i++) {
		points.push(gridPositions.pop()!);
	}

	// Perform Delaunay triangulation to calculate neighbors
	const bounds: Point2D[] = [
		[-3, -3],
		[width + 2, -3],
		[width + 2, height + 2],
		[-3, height + 2],
	];
	const allPoints: Point2D[] = [...points, ...bounds];
	let tris: Triangle[] = [
		new Triangle(allPoints, [cellCount, cellCount + 1, cellCount + 2]),
		new Triangle(allPoints, [cellCount + 1, cellCount + 2, cellCount + 3]),
	];

	for (let iPoint = 0; iPoint < allPoints.length - 4; iPoint++) {
		const point = allPoints[iPoint];

		// Separate triangles into those whose circumcircles
		// contain the point and those that do not
		const inCircle: Triangle[] = [];
		const outCircle: Triangle[] = [];
		for (const t of tris) {
			if (t.circle_contains(point)) {
				inCircle.push(t);
			} else {
				outCircle.push(t);
			}
		}
		tris = outCircle; // Remove triangles that do not

		// Build the hull (ordered loop of points around the new point)
		let hullIndices = inCircle.flatMap((t) => [...t.indices]);
		// Remove duplicate points
		hullIndices = [...new Set(hullIndices)];
		// Sort points counter-clockwise around the new point
		hullIndices.sort((iA, iB) => {
			const angleA = angle_between(point, allPoints[iA]);
			const angleB = angle_between(point, allPoints[iB]);
			return angleA - angleB;
		});
		// Form triangles from the new point to each pair of hull points
		for (const iHullA of hullIndices.keys()) {
			const iHullB = iHullA + 1 >= hullIndices.length ? 0 : iHullA + 1;
			tris.push(new Triangle(allPoints, [hullIndices[iHullA], hullIndices[iHullB], iPoint]));
		}
	}

	// Convert triangles to edges
	const edges = tris.flatMap((t) => {
		return [
			[t.indices[0], t.indices[1]],
			[t.indices[1], t.indices[2]],
			[t.indices[2], t.indices[0]],
		];
	});

	// Build adjacency matrix for voronoi polygon calculations
	const adjmat: boolean[][] = Array.from({ length: allPoints.length }, () =>
		Array.from({ length: allPoints.length })
	);
	for (const [iA, iB] of edges) {
		adjmat[iA][iB] = true;
		adjmat[iB][iA] = true;
	}

	// Construct voronoi cells
	const cells: SweeperCell[] = [];
	for (let iPoint = 0; iPoint < allPoints.length - 4; iPoint++) {
		// ignore border points
		const point = allPoints[iPoint];
		// Get neighboring points
		const neighborIndices: number[] = [];
		const neighborPoints: Point2D[] = [];
		for (const [iNeighbor, isNeighbor] of adjmat[iPoint].entries()) {
			if (isNeighbor) {
				neighborPoints.push(allPoints[iNeighbor]);
				if (iNeighbor < allPoints.length - 4) {
					// ignore border points
					neighborIndices.push(iNeighbor);
				}
			}
		}
		neighborPoints.sort((a, b) => {
			const angleA = angle_between(point, a);
			const angleB = angle_between(point, b);
			return angleA - angleB;
		});
		// Construct region boundary from circumcenters with neighbors
		let regionPoints: Point2D[] = [];
		for (let iNeighbor = 0; iNeighbor < neighborPoints.length; iNeighbor++) {
			const neighborA = neighborPoints[iNeighbor];
			const neighborB = neighborPoints[iNeighbor >= neighborPoints.length - 1 ? 0 : iNeighbor + 1];
			const center = circumcircleCenter([point, neighborA, neighborB]);
			regionPoints.push(center);
		}
		regionPoints.push(regionPoints[0]); // close the loop

		// Clip region polygons to the board bounds
		regionPoints = clipPolygon(regionPoints, -0.5, width - 0.5, -0.5, height - 0.5);

		const cell: SweeperCell = {
			index: iPoint,
			position: allPoints[iPoint],
			border: regionPoints,
			neighbors: [], //neighborIndices,
			isMine: false,
			isRevealed: false,
			isFlagged: false,
			neighborMines: 0,
		};
		cells.push(cell);
	}

	// Reassign connectivity based on shared border points

	// Create a mapping from polygon points to cell index
	const cornerToCellMap = new Map<string, number[]>();
	for (const cell of cells) {
		for (const point of cell.border) {
			const pointStr = `${point}`;
			const cellIndices: number[] = cornerToCellMap.get(pointStr) ?? [];
			cellIndices.push(cell.index);
			cornerToCellMap.set(pointStr, cellIndices);
		}
	}
	for (const neighborGroup of cornerToCellMap.values()) {
		// Add neighbor group as neighbors to each of the cells (will remove duplicates and self-index later)
		for (const neighbor of neighborGroup) {
			cells[neighbor].neighbors = cells[neighbor].neighbors.concat(neighborGroup);
		}
	}
	for (const cell of cells) {
		const neighborSet = new Set<number>(cell.neighbors);
		neighborSet.delete(cell.index);
		cell.neighbors = Array.from(neighborSet);
	}

	// Assign mines and calculate neighbor mine counts
	const mineIndices = shuffle([...Array(cells.length).keys()], random).slice(0, mineCount);
	for (const iMine of mineIndices) {
		cells[iMine].isMine = true;
		for (const iNeighbor of cells[iMine].neighbors) {
			cells[iNeighbor].neighborMines += 1;
		}
	}

	// Calculate the density and danger stats
	const density = cellCount / (BOARD_SIZE * BOARD_SIZE);
	const danger = mineCount / cellCount;

	return {
		width: width,
		height: height,
		density: density,
		danger: danger,
		cells: cells,
		flagCount: 0,
		mineCount: mineCount,
		safeCount: 0,
	};
}
