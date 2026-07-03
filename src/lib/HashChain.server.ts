import { createHmac } from "node:crypto";

/**
 * Synchronous HMAC for backend use
 * @param keyStr Key string
 * @param data Data to hash
 * @returns Hash
 */
function hmacNode(keyStr: string, data: string) {
	return createHmac("sha256", keyStr).update(data).digest("hex");
}

/**
 * Validate the hash of a game by re-computing the hash chain.
 * Note: relies on node:crypto, so can only be used on backend.
 * @param startTime Game start timestamp
 * @param moves Game moves
 * @param expectedHash Submitted hash for the game
 * @returns True if the submitted game hash was correct, otherwise false
 */
export function validateGame(startTime: number, moves: unknown[], expectedHash: string): boolean {
	let hash = String(startTime);
	for (const move of moves) {
		hash = hmacNode(hash, JSON.stringify(move));
	}
	return hash === expectedHash;
}
