import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import SurfacePoints from './SurfacePoints.jsx';
import PolaroidField from './PolaroidField.jsx';
import { getPolaroidImages } from '../lib/imageLoader.js';

const BEAT_CYCLE = 1.1;

/**
 * Drop-in replacement for Heart.jsx once you have a real sculpted
 * `public/models/heart.glb`. Same heartbeat animation, particle
 * attachment, and per-beat polaroid reveal, sourcing geometry from
 * the GLTF instead of the procedural generator.
 *
 * Unlike a hardcoded `nodes.Heart.geometry` lookup (which breaks the
 * moment your export uses a different node name), this walks the
 * loaded scene and grabs the first mesh it finds. That works
 * regardless of what your modeling tool named things. If your file
 * has multiple meshes and you need a *specific* one, pass its exact
 * name via the `pickByName` prop.
 */
export default function HeartFromGLTF({ modelPath = `${import.meta.env.BASE_URL}models/heart.glb`, pickByName }) {
  const groupRef = useRef();
  const currentScale = useRef(1);

  const gltf = useGLTF(modelPath);

  const geometry = useMemo(() => {
    let found = null;

    gltf.scene.traverse((child) => {
      if (found) return;
      if (child.isMesh) {
        if (!pickByName || child.name === pickByName) {
          found = child.geometry;
        }
      }
    });

    if (!found) {
      const names = [];
      gltf.scene.traverse((c) => c.isMesh && names.push(c.name));
      console.error(
        `HeartFromGLTF: no mesh found in "${modelPath}"` +
          (pickByName ? ` matching name "${pickByName}"` : '') +
          `. Meshes available: [${names.join(', ') || 'none'}]`
      );
      return null;
    }

    const geo = found.clone();
    geo.center();
    geo.computeVertexNormals();

    geo.computeBoundingBox();
    const size = new THREE.Vector3();
    geo.boundingBox.getSize(size);
    const targetHeight = 1.6;
    const scaleFactor = targetHeight / (size.y || 1);
    geo.scale(scaleFactor, scaleFactor, scaleFactor);
    geo.center();

    return geo;
  }, [gltf, pickByName, modelPath]);

  const totalImages = useMemo(() => getPolaroidImages().length, []);
  const [revealCount, setRevealCount] = useState(totalImages > 0 ? 1 : 0);
  const lastBeatIndex = useRef(0);

  const heartbeatTarget = (t) => {
    const phase = (t % BEAT_CYCLE) / BEAT_CYCLE;
    const lub = gaussianPulse(phase, 0.08, 0.05);
    const dub = gaussianPulse(phase, 0.22, 0.05) * 0.6;
    return 1 + (lub + dub) * 0.14;
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const target = heartbeatTarget(state.clock.elapsedTime);
    const dampFactor = 1 - Math.pow(0.0001, delta);
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, target, dampFactor);
    groupRef.current.scale.setScalar(currentScale.current);

    if (revealCount < totalImages) {
      const beatIndex = Math.floor(state.clock.elapsedTime / BEAT_CYCLE);
      if (beatIndex > lastBeatIndex.current) {
        lastBeatIndex.current = beatIndex;
        setRevealCount((prev) => Math.min(prev + 1, totalImages));
      }
    }
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={[Math.PI / -2, 0, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color="#ff2d55" roughness={0.35} metalness={0.05} />
      </mesh>
      <SurfacePoints geometry={geometry} />
      <PolaroidField geometry={geometry} distribution="random" revealCount={revealCount} />
    </group>
  );
}

function gaussianPulse(phase, center, width) {
  const d = phase - center;
  return Math.exp(-(d * d) / (2 * width * width));
}

useGLTF.preload(`${import.meta.env.BASE_URL}models/heart.glb`);
