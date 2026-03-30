import { describe, it, expect } from "vitest";
import { distance, average, angle_between, circumcircleCenter, type Point2D } from "./Geometry";

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
});
