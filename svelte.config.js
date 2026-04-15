import adapter from "@sveltejs/adapter-cloudflare";
import { tailwindReference } from "./src/preprocessors/tailwindReference.ts";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import path from "path";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [tailwindReference(path.resolve("./src/routes/layout.css")), vitePreprocess()],

	kit: {
		paths: {
			base: "/voronoisweeper",
		},
		adapter: adapter({
			platformProxy: {
				configPath: "wrangler.json",
				persist: true,
			},
		}),
	},
};

export default config;
