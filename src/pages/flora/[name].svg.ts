// Writes each decorative drawing in lib/art.ts to /flora/<name>.svg, plus the
// still base and swaying parts of the drawings that move in the breeze.
import type { APIRoute } from 'astro';
import { artFiles } from '../../lib/art';

export function getStaticPaths() {
  return artFiles().map(({ file, body }) => ({ params: { name: file }, props: { body } }));
}

export const GET: APIRoute = ({ props }) =>
  new Response((props.body as () => string)(), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
