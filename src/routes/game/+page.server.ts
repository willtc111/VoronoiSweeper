import { redirect } from '@sveltejs/kit';

export function load() {
  console.log('Redirecting back to home');
  throw redirect(303, '..');
}