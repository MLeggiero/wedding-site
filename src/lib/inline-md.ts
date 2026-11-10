import { withBase } from './url';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Tiny Markdown subset for YAML text: [links](/path/), **bold**, *italic*.
 * Site links that start with "/" get the GitHub Pages base path added.
 */
export function inlineMd(src: string): string {
  return escape(src)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text: string, href: string) => {
      const url = href.startsWith('/') ? withBase(href) : href;
      const external = /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${url}"${external}>${text}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
