import { describe, it, expect, beforeAll } from "vitest";
import { CheatingStatus } from "./CheatCheck";
import { env, applyD1Migrations } from "cloudflare:test";

beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe("schema", () => {
	it("flagged_games.reason CHECK matches CheatingStatus enum", async () => {
		const row = await env.DB.prepare(
			`SELECT sql FROM sqlite_master WHERE name = 'flagged_games'`
		).first<{ sql: string }>();

		expect(row).not.toBeNull();

		for (const value of Object.values(CheatingStatus)) {
			if (value === CheatingStatus.Fair) {
				continue; // Skip Fair, as it is not a reason for flagging
			}
			expect(row!.sql).toContain(String(value));
		}
	});
});
