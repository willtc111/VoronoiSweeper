import { angle_between, circumcircleCenter, clipPolygon, type Point2D } from "./Geometry";
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
	circleRadiusSquared: number;

	constructor(points: Point2D[], indices: [number, number, number]) {
		this.indices = indices;
		this.circleCenter = circumcircleCenter([
			points[indices[0]],
			points[indices[1]],
			points[indices[2]],
		]);
		const p0 = points[indices[0]];
		const dx = this.circleCenter[0] - p0[0];
		const dy = this.circleCenter[1] - p0[1];
		this.circleRadiusSquared = dx * dx + dy * dy;
	}

	circle_contains(point: Point2D): boolean {
		const dx = this.circleCenter[0] - point[0];
		const dy = this.circleCenter[1] - point[1];
		return dx * dx + dy * dy <= this.circleRadiusSquared;
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
	let gridPositions: [number, number][] = [...Array(height)].flatMap((_, y) =>
		[...Array(width)].map((_, x) => [x, y] as [number, number])
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
	const tris: Triangle[] = [
		new Triangle(allPoints, [cellCount, cellCount + 1, cellCount + 2]),
		new Triangle(allPoints, [cellCount + 1, cellCount + 2, cellCount + 3]),
	];

	for (let iPoint = 0; iPoint < allPoints.length - 4; iPoint++) {
		const point = allPoints[iPoint];

		// Build the hull (ordered loop of poitns around the new point)
		// from triangles whose circumcircles contain the point
		let hullIndices: number[] = [];
		let writeIndex = 0;
		for (let i = 0; i < tris.length; i++) {
			const t = tris[i];
			if (t.circle_contains(point)) {
				hullIndices.push(t.indices[0], t.indices[1], t.indices[2]);
			} else {
				tris[writeIndex++] = t;
			}
		}
		tris.length = writeIndex;
		// Remove duplicate points
		hullIndices = [...new Set(hullIndices)];

		// Sort points counter-clockwise around the new point
		const hullWithAngles = hullIndices.map((iHull) => ({
			index: iHull,
			angle: angle_between(point, allPoints[iHull]),
		}));
		hullWithAngles.sort((a, b) => a.angle - b.angle);
		hullIndices = hullWithAngles.map((h) => h.index);

		// Form triangles from the new point to each pair of hull points
		for (const iHullA of hullIndices.keys()) {
			const iHullB = iHullA + 1 >= hullIndices.length ? 0 : iHullA + 1;
			tris.push(new Triangle(allPoints, [hullIndices[iHullA], hullIndices[iHullB], iPoint]));
		}
	}

	const incidentTriangles: Triangle[][] = Array.from({ length: allPoints.length }, () => []);
	for (const t of tris) {
		for (const iVertex of t.indices) {
			incidentTriangles[iVertex].push(t);
		}
	}

	// Construct voronoi cells
	const cells: SweeperCell[] = [];
	const boundaryStart = allPoints.length - 4; // Ignore border points
	for (let iPoint = 0; iPoint < boundaryStart; iPoint++) {
		const point = allPoints[iPoint];

		// Sort this point's incident triangles by the angle of their circumcenters
		const withAngles = incidentTriangles[iPoint].map((t) => ({
			center: t.circleCenter,
			angle: angle_between(point, t.circleCenter),
		}));
		withAngles.sort((a, b) => a.angle - b.angle);
		let regionPoints: Point2D[] = withAngles.map((h) => h.center);
		regionPoints.push(regionPoints[0]); // close the loop

		// Clip region polygons to the board bounds
		regionPoints = clipPolygon(regionPoints, -0.5, width - 0.5, -0.5, height - 0.5);

		const cell: SweeperCell = {
			index: iPoint,
			position: allPoints[iPoint],
			border: regionPoints,
			neighbors: [],
			isMine: false,
			isRevealed: false,
			isFlagged: false,
			neighborMines: 0,
		};
		cells.push(cell);
	}

	// Reassign connectivity based on shared border points

	// Create a mapping from polygon points to cell index
	const cornerToCellMap = new Map<number, number[]>();
	const PRECISION = 1e4;
	const KEY_SCALE = 1e7;
	for (const cell of cells) {
		for (const [x, y] of cell.border) {
			const key = Math.round(x * PRECISION) * KEY_SCALE + Math.round(y * PRECISION);
			let cellIndices = cornerToCellMap.get(key);
			if (cellIndices === undefined) {
				cellIndices = [];
				cornerToCellMap.set(key, cellIndices);
			}
			cellIndices.push(cell.index);
		}
	}

	for (const neighborGroup of cornerToCellMap.values()) {
		// Add neighbor group as neighbors to each of the cells (will remove duplicates and self-index later)
		for (const neighbor of neighborGroup) {
			for (const other of neighborGroup) {
				if (other !== neighbor) {
					cells[neighbor].neighbors.push(other);
				}
			}
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
