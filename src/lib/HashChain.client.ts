/**
 * Asynchronous HMAC for frontend use
 * @param keyStr Key string
 * @param data Data to hash
 * @returns Hash
 */
async function hmac(keyStr: string, data: string) {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(keyStr),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	);
	const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
	const hash = Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return hash;
}

/**
 * Update the game hash using the current hash and next move
 * @param currentHash The current game hash
 * @param nextValue JSON string of the move
 * @returns The next game hash
 */
export async function advanceChain(currentHash: string, nextValue: string) {
	return await hmac(currentHash, nextValue);
}
