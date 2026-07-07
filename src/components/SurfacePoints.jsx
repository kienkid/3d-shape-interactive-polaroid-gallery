import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { sampleSurfacePoints } from '../lib/sampler.js';

/**
 * SurfacePoints — the surface interaction / particle layer.
 *
 * Samples points on the given mesh geometry once (via sampler.js +
 * poissonFilter.js), then renders them as small instanced spheres
 * nudged slightly along the surface normal so they read as sitting
 * ON the heart rather than inside it.
 *
 * Because this component is mounted as a child of the same group that
 * the heartbeat animation scales (see Heart.jsx), every particle moves
 * with the heart implicitly — no per-particle animation, no drift.
 *
 * Sampling only runs once per geometry (useMemo), satisfying the
 * "minimal re-computation of sampling" performance requirement.
 */
export default function SurfacePoints({
  geometry,
  count = 1400,
  minDistance = 0.045,
  particleSize = 0.012,
  surfaceOffset = 0.006
}) {
  const meshRef = useRef();

  const points = useMemo(
    () => sampleSurfacePoints(geometry, { count, minDistance }),
    [geometry, count, minDistance]
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Precompute a red/white accent split so the particle field reads as
  // a secondary visual layer distinct from the solid heart body.
  const colors = useMemo(() => {
    const white = new THREE.Color('#ffffff');
    const red = new THREE.Color('#ff6b81');
    return points.map(() => (Math.random() > 0.75 ? white : red));
  }, [points]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    points.forEach((point, i) => {
      const pos = point.position
        .clone()
        .addScaledVector(point.normal, surfaceOffset);

      dummy.position.copy(pos);
      dummy.scale.setScalar(0.7 + Math.random() * 0.6);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, colors[i]);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [points, colors, dummy, surfaceOffset]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, points.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[particleSize, 6, 6]} />
      <meshStandardMaterial
        roughness={0.4}
        metalness={0.1}
        emissive="#ff2d55"
        emissiveIntensity={0.15}
      />
    </instancedMesh>
  );
}
