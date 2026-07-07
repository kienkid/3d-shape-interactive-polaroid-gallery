/**
 * Auto-discovers every image dropped into src/assets/images and
 * returns their bundled URLs via Vite's import.meta.glob.
 *
 * Usage: just drop .jpg/.png/.webp files into src/assets/images/ —
 * no manual import list to maintain. If the dev server was already
 * running when you added new files, restart it once (Vite doesn't
 * always pick up brand-new files in a glob via hot reload).
 */
const modules = import.meta.glob(
  '/src/assets/images/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}',
  { eager: true, import: 'default' }
);

export function getPolaroidImages() {
  return Object.entries(modules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, url], index) => ({
      id: `img-${index}`,
      url,
      name: path.split('/').pop()
    }));
}
