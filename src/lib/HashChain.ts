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
	return Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export async function advanceChain(currentHash: string, nextValue: string) {
	return await hmac(currentHash, nextValue);
}

export async function validateGame(
	startTime: number,
	moves: any[],
	expectedHash: string
): Promise<boolean> {
	let hash = String(startTime);
	for (const move of moves) {
		hash = await advanceChain(hash, JSON.stringify(move));
	}
	return hash === expectedHash;
}
