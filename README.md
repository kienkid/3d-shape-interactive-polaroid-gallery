# Interactive 3D Heart Experience

A lightweight React Three Fiber website centered on a single pulsing
heart with a surface-sampled particle field.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

## What's inside

```
src/
  main.jsx                 – React root
  App.jsx                  – WebGL capability check + fallback UI
  styles.css                – fullscreen dark layout
  components/
    Scene.jsx               – Canvas, camera, lights, background, OrbitControls
    Heart.jsx               – the heart mesh + heartbeat animation (procedural geometry)
    HeartFromGLTF.jsx       – same component, wired to a real heart.glb instead
    SurfacePoints.jsx       – instanced particle field sampled from the heart surface
  lib/
    heartGeometry.js         – procedural heart mesh (no external asset needed)
    sampler.js                – MeshSurfaceSampler wrapper (surface point + normal extraction)
    poissonFilter.js          – blue-noise rejection filter for even particle spacing
    webglCheck.js              – WebGL availability check
public/
  models/                    – drop a real heart.glb here if you have one
```

This matches the data flow from the spec:

```
heart geometry (procedural OR heart.glb)
   ↓
Mesh extraction
   ↓
Surface sampling (MeshSurfaceSampler)   → sampler.js
   ↓
Poisson filtering (even distribution)   → poissonFilter.js
   ↓
Particle rendering (instancedMesh)      → SurfacePoints.jsx
   ↓
Attach to heart animation group         → both mesh + particles live inside
                                           the same <group> in Heart.jsx, so
                                           the heartbeat scale animation moves
                                           them together automatically.
```

## Using a real sculpted heart.glb

No 3D asset was provided with the requirement doc, so the project ships
with a procedural heart (a beveled, extruded bezier heart silhouette —
see `lib/heartGeometry.js`) so it runs with zero setup.

To use your own model instead:

1. Export a heart mesh as `heart.glb` and place it at `public/models/heart.glb`.
2. Open it once with `useGLTF` and check the console/`nodes` object to
   find your mesh's node name.
3. Either edit `Heart.jsx` to source geometry from `useGLTF(...)`
   instead of `createHeartGeometry()`, or simply swap the import in
   `Scene.jsx` from `Heart.jsx` to the ready-made `HeartFromGLTF.jsx`
   (update the `nodes.Heart` key to match your file).

Everything downstream (heartbeat animation, surface sampling, particle
attachment) works unchanged against any mesh geometry.

## Polaroid memory system

Drop photos into `src/assets/images/` (.jpg/.png/.webp) and they'll
automatically turn into polaroids bound to the heart surface — no
code changes needed, just restart the dev server if it was already
running when you added files.

```
src/
  assets/images/            – put your photos here
  context/
    FocusContext.jsx         – tracks which polaroid (if any) the camera is zoomed to
  components/
    Polaroid.jsx              – single card: texture, thickness illusion, partial billboarding, hover/click
    PolaroidField.jsx         – population manager: samples points, assigns images, supports 'random' / 'grouped' / 'density' distribution
    CameraRig.jsx              – eases the camera to a clicked polaroid and back
  lib/
    imageLoader.js             – auto-discovers files in assets/images via import.meta.glob
```

**Interaction:**
- Hover a polaroid → it pops out slightly and enlarges (uses r3f's built-in pointer events, which are raycaster-backed).
- Click a polaroid → it opens in a fullscreen 2D lightbox styled like the physical polaroid card (white frame, extra bottom margin, square photo), with a small pop-in-from-center animation. No close button — click anywhere outside the card, or press Escape, to dismiss.
- Photos appear on the heart one at a time, one per heartbeat, growing in from nothing, until every image in the folder has appeared.
- Exactly one polaroid renders per image found in `src/assets/images/` — no repeats, no padding to a fixed count. Minimum spacing between anchor points is derived from the card's real size, so cards never overlap regardless of photo count.

**Background music:**
- Drop exactly one `.mp3` into `src/assets/music/` and it plays on loop automatically (`src/lib/musicLoader.js` + `src/components/BackgroundMusic.jsx`).
- Browsers block autoplay-with-sound until the page has been interacted with, so playback also retries on the first click/tap/keypress anywhere if the initial attempt is blocked.
- A small "♪ on / ♪ off" toggle in the top-right corner lets the user mute without touching browser controls.

**Tuning:**
- `Heart.jsx` → `<PolaroidField distribution="random" />` — switch to `"grouped"` (photos sit a bit closer, in loose piles) or `"density"` (biased toward the front-facing side).
- `Heart.jsx` → `BEAT_CYCLE` constant controls both the heartbeat timing and how fast a new polaroid reveals (one per beat).
- Both the particle field and polaroids currently render together — set `count={0}` on `<SurfacePoints />` in `Heart.jsx` if you want photos only.

## Other tuning knobs

- `Heart.jsx` → `heartbeatTarget()`: cycle length, pulse shape (lub/dub timing), scale amplitude.
- `SurfacePoints.jsx` props: `count` (particle count), `minDistance` (spacing / density), `particleSize`, `surfaceOffset`.
- `Scene.jsx`: camera position/fov, light intensities, `autoRotateSpeed` (set to `0` for a fully static camera), background color.

## Performance notes

- Surface sampling runs once per geometry via `useMemo` (see
  `SurfacePoints.jsx`), not per frame — satisfies the "minimal
  re-computation of sampling" requirement.
- Particles render as a single `instancedMesh` draw call rather than
  1000+ individual meshes.
- Heartbeat animation only touches one group's `scale`, so particles
  never need their own per-frame updates — they inherit motion for free.
- Target: stable 60fps on integrated GPUs at moderate particle counts (~1000–1500).
