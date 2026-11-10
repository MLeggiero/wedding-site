/** Prefix a site-root path ("/travel/") with the GitHub Pages base ("/wedding-site"). */
export function withBase(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

/** True when `path` (site-root form) is the current page. */
export function isCurrent(path: string, pathname: string): boolean {
  const here = pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ''), '') || '/';
  return path === '/' ? here === '/' : here.startsWith(path);
}
