import { describe, it, expect } from "vitest";
import { mulberry32, generateSeed, stringToHash, shuffle, type RNG } from "./Random";

describe("Random", () => {
	describe("mulberry32", () => {
		it("should return a function that generates pseudo-random numbers", () => {
			const rng = mulberry32(12345);
			expect(typeof rng).toBe("function");
			const value = rng();
			expect(typeof value).toBe("number");
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(1);
		});

		it("should produce deterministic results for the same seed", () => {
			const rng1 = mulberry32(42);
			const rng2 = mulberry32(42);
			expect(rng1()).toBe(rng2());
			expect(rng1()).toBe(rng2());
		});

		it("should produce different results for different seeds", () => {
			const rng1 = mulberry32(1);
			const rng2 = mulberry32(2);
			expect(rng1()).not.toBe(rng2());
		});
	});

	describe("generateSeed", () => {
		it("should generate a seed string", () => {
			const seed = generateSeed();
			expect(typeof seed).toBe("string");
			expect(seed.length).toBeGreaterThan(0);
		});

		it("should use the provided RNG", () => {
			let callCount = 0;
			const mockRng: RNG = () => {
				callCount++;
				return 0.123456789;
			};
			const seed = generateSeed(mockRng);
			expect(callCount).toBe(1);
			expect(seed).toBe((0.123456789).toString(36).substring(2, 10));
		});
	});

	describe("stringToHash", () => {
		it("should return a number for a given string", () => {
			const hash = stringToHash("test");
			expect(typeof hash).toBe("number");
			expect(hash).toBeGreaterThanOrEqual(0);
		});

		it("should produce the same hash for the same string", () => {
			expect(stringToHash("hello")).toBe(stringToHash("hello"));
		});

		it("should produce different hashes for different strings", () => {
			expect(stringToHash("hello")).not.toBe(stringToHash("world"));
		});

		it("should handle empty string", () => {
			const hash = stringToHash("");
			expect(typeof hash).toBe("number");
		});
	});

	describe("shuffle", () => {
		it("should return a new array with the same elements", () => {
			const original = [1, 2, 3, 4, 5];
			const rng: RNG = () => 0.5; // Deterministic for testing
			const shuffled = shuffle(original, rng);
			expect(shuffled).not.toBe(original); // Different reference
			expect(shuffled.sort()).toEqual(original.sort()); // Same elements
		});

		it("should shuffle deterministically with the same RNG", () => {
			const array = [1, 2, 3, 4, 5];
			const rng1: RNG = () => 0.1;
			const rng2: RNG = () => 0.1;
			const shuffled1 = shuffle(array, rng1);
			const shuffled2 = shuffle(array, rng2);
			expect(shuffled1).toEqual(shuffled2);
		});

		it("should handle empty array", () => {
			const rng: RNG = () => 0.5;
			const shuffled = shuffle([], rng);
			expect(shuffled).toEqual([]);
		});

		it("should handle single element array", () => {
			const rng: RNG = () => 0.5;
			const shuffled = shuffle([42], rng);
			expect(shuffled).toEqual([42]);
		});
	});
});
