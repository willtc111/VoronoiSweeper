import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  console.log('Loading game with gameseed:', params.gameseed);
  return {
    gameseed: params.gameseed
  };
};