import { angle_between, average, circumcircleCenter, clipPolygon, distance, type Point2D } from "./Geometry";
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
	flagCount: number;
	mineCount: number;
	safeCount: number;
	cells: SweeperCell[];
};

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
	let maxOffset = 0;
	let gridPositions: [number, number][] = [...Array(height)].flatMap((_, y) =>
		[...Array(width)].map(
			(_, x) => [x + random() * maxOffset, y + random() * maxOffset] as [number, number]
		)
	);
	gridPositions = shuffle(gridPositions, random);

	// Select cell positions
	let points: Point2D[] = [];
	for (let i = 0; i < cellCount; i++) {
		points.push(gridPositions.pop()!);
	}

	// Perform Delaunay triangulation to calculate neighbors
	let bounds: Point2D[] = [
		[-3, -3],
		[width+2, -3],
		[width+2, height+2],
		[-3, height+2],
	];
	let allPoints: Point2D[] = [...points, ...bounds];
	let tris: Triangle[] = [
		new Triangle(allPoints, [cellCount, cellCount + 1, cellCount + 2]),
		new Triangle(allPoints, [cellCount + 1, cellCount + 2, cellCount + 3]),
	];

	for (let iPoint = 0; iPoint < allPoints.length - 4; iPoint++) {
		let point = allPoints[iPoint];

		// Separate triangles into those whose circumcircles
		// contain the point and those that do not
		let inCircle: Triangle[] = [];
		let outCircle: Triangle[] = [];
		for (let t of tris) {
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
			let angleA = angle_between(point, allPoints[iA]);
			let angleB = angle_between(point, allPoints[iB]);
			return angleA - angleB;
		});
		// Form triangles from the new point to each pair of hull points
		for (let iHullA of hullIndices.keys()) {
			let iHullB = iHullA + 1 >= hullIndices.length ? 0 : iHullA + 1;
			tris.push(new Triangle(allPoints, [hullIndices[iHullA], hullIndices[iHullB], iPoint]));
		}
	}

	// Convert triangles to edges
	let edges = tris.flatMap((t) => {
		return [
			[t.indices[0], t.indices[1]],
			[t.indices[1], t.indices[2]],
			[t.indices[2], t.indices[0]],
		];
	});

	// Build adjacency matrix for voronoi polygon calculations
	let adjmat: boolean[][] = Array.from({ length: allPoints.length }, () =>
		Array.from({ length: allPoints.length })
	);
	for (let [iA, iB] of edges) {
		adjmat[iA][iB] = true;
		adjmat[iB][iA] = true;
	}

	// Construct voronoi cells
	let cells: SweeperCell[] = [];
	for (let iPoint = 0; iPoint < allPoints.length - 4; iPoint++) {
		// ignore border points
		let point = allPoints[iPoint];
		// Get neighboring points
		let neighborIndices: number[] = [];
		let neighborPoints: Point2D[] = [];
		for (let [iNeighbor, isNeighbor] of adjmat[iPoint].entries()) {
			if (isNeighbor) {
				neighborPoints.push(allPoints[iNeighbor]);
				if (iNeighbor < allPoints.length - 4) {
					// ignore border points
					neighborIndices.push(iNeighbor);
				}
			}
		}
		neighborPoints.sort((a, b) => {
			let angleA = angle_between(point, a);
			let angleB = angle_between(point, b);
			return angleA - angleB;
		});
		// Construct region boundary from circumcenters with neighbors
		let regionPoints: Point2D[] = [];
		for (let iNeighbor = 0; iNeighbor < neighborPoints.length; iNeighbor++) {
			let neighborA = neighborPoints[iNeighbor];
			let neighborB = neighborPoints[iNeighbor >= neighborPoints.length - 1 ? 0 : iNeighbor + 1];
			let center = circumcircleCenter([point, neighborA, neighborB]);
			regionPoints.push(center);
		}
		regionPoints.push(regionPoints[0]); // close the loop

		// Clip region polygons to the board bounds
		regionPoints = clipPolygon(regionPoints, -0.5, width-0.5, -0.5, height-0.5);

		let cell: SweeperCell = {
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
	for (let cell of cells) {
		for (let point of cell.border) {
			const pointStr = `${point}`;
			const cellIndices: number[] = cornerToCellMap.get(pointStr) ?? [];
			cellIndices.push(cell.index);
			cornerToCellMap.set(pointStr, cellIndices);
		}
	}
	for (let neighborGroup of cornerToCellMap.values()) {
		// Add neighbor group as neighbors to each of the cells (will remove duplicates and self-index later)
		for (let neighbor of neighborGroup) {
			cells[neighbor].neighbors = cells[neighbor].neighbors.concat(neighborGroup);
		}
	}
	for (let cell of cells) {
		let neighborSet = new Set<number>(cell.neighbors);
		neighborSet.delete(cell.index);
		cell.neighbors = Array.from(neighborSet);
	}

	// Assign mines and calculate neighbor mine counts
	let mineIndices = shuffle([...Array(cells.length).keys()], random).slice(0, mineCount);
	for (let iMine of mineIndices) {
		cells[iMine].isMine = true;
		for (let iNeighbor of cells[iMine].neighbors) {
			cells[iNeighbor].neighborMines += 1;
		}
	}

	return {
		width: width,
		height: height,
		cells: cells,
		flagCount: 0,
		mineCount: mineCount,
		safeCount: 0,
	};
}

export function clearSave() {
	localStorage.removeItem("saveSeed");
	localStorage.removeItem("saveSteps");
	localStorage.removeItem("saveStartTime");
}
