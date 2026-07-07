import React, { useMemo } from 'react';
import { sampleSurfacePoints } from '../lib/sampler.js';
import { getPolaroidImages } from '../lib/imageLoader.js';
import Polaroid, { FRAME_WIDTH, FRAME_HEIGHT } from './Polaroid.jsx';

// Minimum gap enforced between polaroid anchor points, derived from the
// card's own footprint (its diagonal) plus a safety margin, so cards
// can never overlap regardless of how many photos are supplied.
const CARD_DIAGONAL = Math.sqrt(FRAME_WIDTH ** 2 + FRAME_HEIGHT ** 2);
const MIN_SPACING = CARD_DIAGONAL * 1.3;

/**
 * PolaroidField — the population manager.
 *
 * Renders exactly one polaroid per image found in src/assets/images —
 * no repeats, no padding to a fixed count. Anchor points are sampled
 * from the heart surface with a minimum spacing derived from the
 * card's real size, so polaroids never overlap each other no matter
 * how many (or few) photos are supplied.
 *
 * distribution:
 *  - 'random'   even, uncorrelated placement (default)
 *  - 'grouped'  photos sit closer together in loose little clusters
 *  - 'density'  placement biased toward the front-facing side of the heart
 */
export default function PolaroidField({ geometry, distribution = 'random', revealCount = Infinity }) {
  const images = useMemo(() => getPolaroidImages(), []);
  const count = images.length;

  const points = useMemo(() => {
    if (count === 0) return [];

    if (distribution === 'density') {
      // Oversample with a slightly looser spacing, then keep the most
      // front-facing points — still spaced enough to avoid overlap.
      const raw = sampleSurfacePoints(geometry, {
        count: count * 3,
        minDistance: MIN_SPACING * 0.9
      });
      return [...raw].sort((a, b) => b.normal.z - a.normal.z).slice(0, count);
    }

    // 'grouped' allows cards a bit closer together than 'random' so
    // they read as loose little piles, but never so close they overlap.
    const spacing = distribution === 'grouped' ? MIN_SPACING * 0.8 : MIN_SPACING;
    return sampleSurfacePoints(geometry, { count, minDistance: spacing });
  }, [geometry, count, distribution]);

  const assignments = useMemo(
    () =>
      points.map((p, i) => ({
        id: `polaroid-${i}`,
        image: images[i],
        position: p.position,
        normal: p.normal,
        tilt: (Math.random() - 0.5) * 0.5
      })),
    [points, images]
  );

  if (assignments.length === 0) {
    return null; // no images uploaded yet
  }

  const visible = assignments.slice(0, revealCount);

  return (
    <group>
      {visible.map((a) => (
        <Polaroid key={a.id} id={a.id} image={a.image} position={a.position} normal={a.normal} tilt={a.tilt} />
      ))}
    </group>
  );
}
