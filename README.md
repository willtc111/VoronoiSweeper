# Voronoi Sweeper

Classic Minesweeper uses a grid of squares. What if it could use arbitrary arrangement of any convex polygons?

Voronoi Sweeper explores this idea by using a [Voronoi partitioning](https://en.wikipedia.org/wiki/Voronoi_diagram) of random points to create a Minesweeper board. Like in the original game, cells that share corners are considered to be touching.

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Testing

To run the tests:

```sh
npm run test
```

## Debugging

To do script execution for manual testing or debugging, use vite-node so that import aliases work:

```sh
npx vite-node <path_to_script>
```

To do profiling with the `chrome://inspect` DevTools:

```sh
npx --node-options="--inspect-brk" vite-node <path_to_script>
```
