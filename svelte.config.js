import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		paths: {
			base: "/voronoisweeper",
		},
		adapter: adapter({
      platformProxy: {
        configPath: 'wrangler.json',
        persist: true
      }
    }),
	},
};

export default config;
