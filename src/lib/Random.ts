export type RNG = () => number;

/**
 * Mulberry32 pseudo-random number generator
 * @param seed Seed number
 * @returns Pseudo-random value
 */
export function mulberry32(seed: number): RNG {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a random seed string
 * @param rng RNG function
 * @returns Seed string
 */
export function generateSeed(rng: RNG = mulberry32(Date.now())): string {
  return rng().toString(36).substring(2, 10);
}

/**
 * FNV-1a hash function to convert a string to a seed number
 * @param str Seed string
 * @returns Seed number
 */
export function seedToHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Fisher-Yates shuffle an array
 * @param inputArray Unshuffled array
 * @param rng RNG function
 * @returns Shuffled array
 */
export function shuffle<T>(inputArray: T[], rng: RNG): T[] {
  const array = inputArray.slice();
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}