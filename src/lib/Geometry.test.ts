import { describe, it, expect } from "vitest";
import {
	distance,
	average,
	angle_between,
	circumcircleCenter,
	clipPolygon,
	type Point2D,
} from "./Geometry";

// Helper function to normalize polygon points for comparison
function normalizePolygon(polygon: Point2D[]): Point2D[] {
	if (polygon.length === 0) return polygon;
	// Find the index of the lexicographically smallest point
	let minIdx = 0;
	for (let i = 1; i < polygon.length; i++) {
		if (
			polygon[i][0] < polygon[minIdx][0] ||
			(polygon[i][0] === polygon[minIdx][0] && polygon[i][1] < polygon[minIdx][1])
		) {
			minIdx = i;
		}
	}
	return [...polygon.slice(minIdx), ...polygon.slice(0, minIdx)];
}

describe("Geometry", () => {
	describe("distance", () => {
		it("should calculate the Euclidean distance between two points", () => {
			const a: Point2D = [0, 0];
			const b: Point2D = [3, 4];
			expect(distance(a, b)).toBe(5);
		});

		it("should return 0 for the same point", () => {
			const a: Point2D = [1, 1];
			const b: Point2D = [1, 1];
			expect(distance(a, b)).toBe(0);
		});

		it("should handle negative coordinates", () => {
			const a: Point2D = [-1, -1];
			const b: Point2D = [1, 1];
			expect(distance(a, b)).toBeCloseTo(Math.sqrt(8), 5);
		});
	});

	describe("average", () => {
		it("should calculate the midpoint between two points", () => {
			const a: Point2D = [0, 0];
			const b: Point2D = [2, 2];
			expect(average(a, b)).toEqual([1, 1]);
		});

		it("should handle negative coordinates", () => {
			const a: Point2D = [-2, -2];
			const b: Point2D = [2, 2];
			expect(average(a, b)).toEqual([0, 0]);
		});

		it("should handle decimal coordinates", () => {
			const a: Point2D = [1.5, 2.5];
			const b: Point2D = [3.5, 4.5];
			expect(average(a, b)).toEqual([2.5, 3.5]);
		});
	});

	describe("angle_between", () => {
		it("should calculate the angle from point a to point b", () => {
			const a: Point2D = [1, 0];
			const b: Point2D = [0, 0];
			expect(angle_between(a, b)).toBeCloseTo(0, 5); // Along positive x-axis
		});

		it("should calculate 90 degrees (pi/2) for perpendicular points", () => {
			const a: Point2D = [0, 1];
			const b: Point2D = [0, 0];
			expect(angle_between(a, b)).toBeCloseTo(Math.PI / 2, 5);
		});

		it("should handle negative angles", () => {
			const a: Point2D = [0, -1];
			const b: Point2D = [0, 0];
			expect(angle_between(a, b)).toBeCloseTo(-Math.PI / 2, 5);
		});
	});

	describe("circumcircleCenter", () => {
		it("should calculate the circumcenter of three non-collinear points", () => {
			const points: [Point2D, Point2D, Point2D] = [
				[0, 0],
				[1, 0],
				[0, 1],
			];
			const center = circumcircleCenter(points);
			// For equilateral triangle, center should be at (0.5, 0.5)
			expect(center[0]).toBeCloseTo(0.5, 5);
			expect(center[1]).toBeCloseTo(0.5, 5);
		});

		it("should throw an error for fewer than 3 points", () => {
			const points: [Point2D, Point2D] = [
				[0, 0],
				[1, 0],
			];
			expect(() => circumcircleCenter(points as any)).toThrow("Need exactly 3 points");
		});

		it("should handle collinear points by returning average", () => {
			const points: [Point2D, Point2D, Point2D] = [
				[0, 0],
				[1, 1],
				[2, 2],
			];
			const center = circumcircleCenter(points);
			// Should return average: (0+1+2)/3 = 1, (0+1+2)/3 = 1
			expect(center[0]).toBeCloseTo(1, 5);
			expect(center[1]).toBeCloseTo(1, 5);
		});
	});

	describe("clipPolygon", () => {
		it("should return the polygon unchanged if completely inside the clipping rectangle", () => {
			const polygon: Point2D[] = [
				[1, 1],
				[2, 1],
				[2, 2],
				[1, 2],
			];
			const result = clipPolygon(polygon, 0, 3, 0, 3);
			expect(normalizePolygon(result)).toEqual(normalizePolygon(polygon));
		});

		it("should return an empty array if polygon is completely outside the clipping rectangle", () => {
			const polygon: Point2D[] = [
				[5, 5],
				[6, 5],
				[6, 6],
				[5, 6],
			];
			const result = clipPolygon(polygon, 0, 3, 0, 3);
			expect(normalizePolygon(result)).toEqual([]);
		});

		it("should clip polygon against left edge", () => {
			const polygon: Point2D[] = [
				[-1, 1],
				[2, 1],
				[2, 2],
				[-1, 2],
			];
			const result = clipPolygon(polygon, 0, 3, 0, 3);
			expect(normalizePolygon(result)).toEqual([
				[0, 1],
				[2, 1],
				[2, 2],
				[0, 2],
			]);
		});

		it("should clip polygon against right edge", () => {
			const polygon: Point2D[] = [
				[1, 1],
				[4, 1],
				[4, 2],
				[1, 2],
			];
			const result = clipPolygon(polygon, 0, 3, 0, 3);
			expect(normalizePolygon(result)).toEqual([
				[1, 1],
				[3, 1],
				[3, 2],
				[1, 2],
			]);
		});

		it("should clip polygon against bottom edge", () => {
			const polygon: Point2D[] = [
				[1, -1],
				[2, -1],
				[2, 2],
				[1, 2],
			];
			const result = clipPolygon(polygon, 0, 3, 0, 3);
			expect(normalizePolygon(result)).toEqual([
				[1, 0],
				[2, 0],
				[2, 2],
				[1, 2],
			]);
		});

		it("should clip polygon against top edge", () => {
			const polygon: Point2D[] = [
				[1, 1],
				[2, 1],
				[2, 4],
				[1, 4],
			];
			const result = clipPolygon(polygon, 0, 3, 0, 3);
			expect(normalizePolygon(result)).toEqual([
				[1, 1],
				[2, 1],
				[2, 3],
				[1, 3],
			]);
		});

		it("should handle complex clipping with multiple edges", () => {
			const polygon: Point2D[] = [
				[-1, -1],
				[4, -1],
				[4, 4],
				[-1, 4],
			];
			const result = clipPolygon(polygon, 0, 3, 0, 3);
			expect(normalizePolygon(result)).toEqual([
				[0, 0],
				[3, 0],
				[3, 3],
				[0, 3],
			]);
		});

		it("should handle triangle clipping", () => {
			const polygon: Point2D[] = [
				[1, 2],
				[3, 4],
				[4, -1],
			];
			const result = clipPolygon(polygon, 0, 3, 0, 3);
			expect(normalizePolygon(result)).toEqual([
				[1, 2],
				[2, 3],
				[3, 3],
				[3, 0],
			]);
		});

		it("should handle empty polygon", () => {
			const polygon: Point2D[] = [];
			const result = clipPolygon(polygon, 0, 3, 0, 3);
			expect(result).toEqual([]);
		});

		it("should handle polygon with points on the edge", () => {
			const polygon: Point2D[] = [
				[0, 0],
				[3, 0],
				[3, 3],
				[0, 3],
			];
			const result = clipPolygon(polygon, 0, 3, 0, 3);
			expect(normalizePolygon(result)).toEqual(normalizePolygon(polygon));
		});
	});
});
