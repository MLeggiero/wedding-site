// Writes each decorative drawing in lib/art.ts to /flora/<name>.svg.
import type { APIRoute } from 'astro';
import { artFile, artNames, type ArtName } from '../../lib/art';

export function getStaticPaths() {
  return artNames.map((name) => ({ params: { name } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(artFile(params.name as ArtName), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
