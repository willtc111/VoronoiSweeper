import { describe, it, expect } from 'vitest';
import { createBoard, Triangle, type Board, type SweeperCell } from './Board';
import { mulberry32 } from './Random';

describe('Board', () => {
	describe('createBoard', () => {
		it('should throw an error for fewer than 3 cells', () => {
			const rng = mulberry32(42);
			expect(() => createBoard(10, 10, 2, 1, rng)).toThrow('At least 3 cells are required');
		});

		it('should throw an error if cellCount exceeds grid space', () => {
			const rng = mulberry32(42);
			expect(() => createBoard(2, 2, 5, 1, rng)).toThrow('Not enough space');
		});

		it('should throw an error if mineCount >= cellCount', () => {
			const rng = mulberry32(42);
			expect(() => createBoard(10, 10, 5, 5, rng)).toThrow('Number of mines must be less than number of cells');
		});

		it('should throw an error if mineCount < 1', () => {
			const rng = mulberry32(42);
			expect(() => createBoard(10, 10, 5, 0, rng)).toThrow('Number of mines must be at least 1');
		});

		it('should create a board with the correct dimensions and counts', () => {
			const rng = mulberry32(42);
			const board: Board = createBoard(5, 5, 10, 3, rng);
			expect(board.width).toBe(5);
			expect(board.height).toBe(5);
			expect(board.cells.length).toBe(10);
			expect(board.mineCount).toBe(3);
			expect(board.flagCount).toBe(0);
			expect(board.safeCount).toBe(0);
		});

		it('should assign mines correctly', () => {
			const rng = mulberry32(42);
			const board: Board = createBoard(5, 5, 10, 3, rng);
			const mineCells = board.cells.filter(cell => cell.isMine);
			expect(mineCells.length).toBe(3);
		});

		it('should calculate neighbor mine counts correctly', () => {
			const rng = mulberry32(42);
			const board: Board = createBoard(5, 5, 10, 3, rng);
			// For each cell, check that neighborMines matches the number of mine neighbors
			for (const cell of board.cells) {
				const actualNeighborMines = cell.neighbors.filter(neighborIndex =>
					board.cells[neighborIndex].isMine
				).length;
				expect(cell.neighborMines).toBe(actualNeighborMines);
			}
		});

		it('should ensure all cells have positions within bounds', () => {
			const rng = mulberry32(42);
			const board: Board = createBoard(5, 5, 10, 3, rng);
			for (const cell of board.cells) {
				expect(cell.position[0]).toBeGreaterThanOrEqual(0);
				expect(cell.position[0]).toBeLessThanOrEqual(5);
				expect(cell.position[1]).toBeGreaterThanOrEqual(0);
				expect(cell.position[1]).toBeLessThanOrEqual(5);
			}
		});

		it('should ensure cells have borders and neighbors', () => {
			const rng = mulberry32(42);
			const board: Board = createBoard(5, 5, 10, 3, rng);
			for (const cell of board.cells) {
				expect(cell.border.length).toBeGreaterThan(0);
				expect(cell.neighbors.length).toBeGreaterThanOrEqual(0);
				// Neighbors should be valid indices
				for (const neighbor of cell.neighbors) {
					expect(neighbor).toBeGreaterThanOrEqual(0);
					expect(neighbor).toBeLessThan(board.cells.length);
					expect(neighbor).not.toBe(cell.index);
				}
			}
		});

		it('should produce deterministic results with the same RNG', () => {
			const rng1 = mulberry32(123);
			const rng2 = mulberry32(123);
			const board1 = createBoard(5, 5, 10, 3, rng1);
			const board2 = createBoard(5, 5, 10, 3, rng2);
			expect(board1.cells.length).toBe(board2.cells.length);
			for (let i = 0; i < board1.cells.length; i++) {
				expect(board1.cells[i].position).toEqual(board2.cells[i].position);
				expect(board1.cells[i].isMine).toBe(board2.cells[i].isMine);
			}
		});
	});

	describe('Triangle', () => {
		it('should construct a triangle with correct circumcircle', () => {
			const points: [number, number][] = [[0, 0], [1, 0], [0, 1]];
			const indices: [number, number, number] = [0, 1, 2];
			const triangle = new Triangle(points, indices);
			expect(triangle.indices).toEqual(indices);
			expect(triangle.circleCenter).toEqual([0.5, 0.5]); // Circumcenter of equilateral triangle
			expect(triangle.circleRadius).toBeCloseTo(Math.sqrt(0.5), 5); // Distance from center to vertex
		});

		it('should detect if a point is inside the circumcircle', () => {
			const points: [number, number][] = [[0, 0], [2, 0], [0, 2]];
			const indices: [number, number, number] = [0, 1, 2];
			const triangle = new Triangle(points, indices);
			// Center should be inside
			expect(triangle.circle_contains([1, 1])).toBe(true);
			// Vertex should be on the boundary (distance == radius)
			expect(triangle.circle_contains([0, 0])).toBe(true);
			// Point outside
			expect(triangle.circle_contains([3, 3])).toBe(false);
		});

		it('should handle collinear points', () => {
			const points: [number, number][] = [[0, 0], [1, 1], [2, 2]];
			const indices: [number, number, number] = [0, 1, 2];
			const triangle = new Triangle(points, indices);
			// For collinear, circumcircleCenter returns average, so radius is distance from center to a point
			expect(triangle.circleCenter).toEqual([1, 1]); // Average
			expect(triangle.circleRadius).toBeCloseTo(Math.sqrt(2), 5); // Distance from (1,1) to (0,0)
		});
	});
});