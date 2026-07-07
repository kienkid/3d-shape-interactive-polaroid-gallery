/**
 * Auto-discovers the single mp3 dropped into src/assets/music and
 * returns its bundled URL via Vite's import.meta.glob. If more than
 * one file is present, the first one (alphabetically) is used.
 */
const modules = import.meta.glob('/src/assets/music/*.mp3', {
  eager: true,
  import: 'default'
});

export function getBackgroundMusicUrl() {
  const entries = Object.entries(modules).sort(([a], [b]) => a.localeCompare(b));
  return entries.length > 0 ? entries[0][1] : null;
}
