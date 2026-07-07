import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createHeartGeometry } from '../lib/heartGeometry.js';
import SurfacePoints from './SurfacePoints.jsx';
import PolaroidField from './PolaroidField.jsx';
import { getPolaroidImages } from '../lib/imageLoader.js';

const BEAT_CYCLE = 1.1; // seconds per full heartbeat cycle — shared by the
// pulse animation and the "one more polaroid per beat" reveal below.

/**
 * Heart — the single main object in the scene.
 *
 * Acts as visual centerpiece, interaction surface, and particle anchor.
 * Geometry is procedural by default (see lib/heartGeometry.js) so the
 * project runs with zero external assets. To use a real sculpted
 * heart.glb instead, replace the `geometry` useMemo below with:
 *
 *   const { nodes } = useGLTF('/models/heart.glb');
 *   const geometry = nodes.Heart.geometry;
 *
 * Everything else (heartbeat animation, surface sampling, particle
 * attachment) works unchanged against any mesh geometry you provide.
 */
export default function Heart() {
  const groupRef = useRef();
  const currentScale = useRef(1);

  const geometry = useMemo(() => createHeartGeometry(), []);

  // Reveal polaroids one at a time, one per heartbeat, until every
  // photo in the folder has appeared.
  const totalImages = useMemo(() => getPolaroidImages().length, []);
  const [revealCount, setRevealCount] = useState(totalImages > 0 ? 1 : 0);
  const lastBeatIndex = useRef(0);

  // Continuous "lub-dub" heartbeat: two quick pulses per cycle, then a
  // rest period, mimicking a real cardiac rhythm rather than a plain
  // sine wave. Values are eased with critically-damped spring lerping
  // in useFrame below so the motion stays smooth (no snapping).
  const heartbeatTarget = (t) => {
    const phase = (t % BEAT_CYCLE) / BEAT_CYCLE;

    const lub = gaussianPulse(phase, 0.08, 0.05);
    const dub = gaussianPulse(phase, 0.22, 0.05) * 0.6;

    const bump = lub + dub;
    return 1 + bump * 0.14; // scale amplitude
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const target = heartbeatTarget(state.clock.elapsedTime);

    // Spring-like damped approach to the target scale — smooth easing,
    // no rotation drift, group stays fixed at world origin.
    const dampFactor = 1 - Math.pow(0.0001, delta);
    currentScale.current = THREE.MathUtils.lerp(
      currentScale.current,
      target,
      dampFactor
    );

    groupRef.current.scale.setScalar(currentScale.current);

    // Reveal the next polaroid each time a new beat cycle starts.
    if (revealCount < totalImages) {
      const beatIndex = Math.floor(state.clock.elapsedTime / BEAT_CYCLE);
      if (beatIndex > lastBeatIndex.current) {
        lastBeatIndex.current = beatIndex;
        setRevealCount((prev) => Math.min(prev + 1, totalImages));
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={[Math.PI / -2, 0, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#ff2d55"
          roughness={0.35}
          metalness={0.05}
          clearcoat={0.4}
        />
      </mesh>

      {/* Particles are children of this same group, so they inherit
          the heartbeat scale automatically and never drift independently. */}
      <SurfacePoints geometry={geometry} />

      {/* Polaroid memories bound to the same surface + same pulsing group.
          revealCount grows by one each heartbeat until every photo has appeared. */}
      <PolaroidField geometry={geometry} distribution="random" revealCount={revealCount} />
    </group>
  );
}

// Smooth bump centered at `center` (in normalized 0..1 phase space)
// with the given width, used to build the lub-dub waveform.
function gaussianPulse(phase, center, width) {
  const d = phase - center;
  return Math.exp(-(d * d) / (2 * width * width));
}
