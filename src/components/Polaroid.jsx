import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useFocus } from '../context/FocusContext.jsx';

export const FRAME_WIDTH = 0.34;
export const FRAME_HEIGHT = 0.4;
const FRAME_DEPTH = 0.012;
const PHOTO_WIDTH = 0.28;
const PHOTO_HEIGHT = 0.28;
const PHOTO_Y_OFFSET = 0.03; // extra white space at the bottom, classic polaroid look

/**
 * Polaroid — one visual memory, bound to a fixed point on the heart
 * surface.
 *
 * - Image texture + flat card geometry with a thin box body for a
 *   slight physical-thickness illusion (instead of a paper-flat plane).
 * - Orientation blends a "face outward from the heart" quaternion with
 *   a camera-facing quaternion (partial billboarding) so cards stay
 *   readable without looking pasted flat onto a sphere.
 * - Hover/click use react-three-fiber's built-in pointer events, which
 *   are backed by a THREE.Raycaster under the hood — this is the
 *   raycasting/hover-detection system from the spec.
 * - Click opens the image in a fullscreen DOM lightbox (see
 *   ImageLightbox.jsx) rather than moving the 3D camera.
 */
export default function Polaroid({ id, image, position, normal, tilt = 0, billboardStrength = 0 }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();
  const { focused, openImage, closeImage } = useFocus();

  const texture = useTexture(image.url);
  const isOpen = focused?.id === id;

  // Base orientation: local +Z points along the outward surface normal,
  // with a small extra in-plane tilt so cards don't look uniform.
  const outwardQuat = useMemo(() => {
    const q = new THREE.Quaternion();
    const m = new THREE.Matrix4();
    const up = Math.abs(normal.y) > 0.95 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    m.lookAt(new THREE.Vector3(0, 0, 0), normal.clone().negate(), up);
    q.setFromRotationMatrix(m);
    const tiltQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), tilt);
    return q.multiply(tiltQuat);
  }, [normal, tilt]);

  const currentScale = useRef(1);
  const spawnProgress = useRef(0); // 0 → 1 grow-in animation played once on mount
  const camFacingQuat = useMemo(() => new THREE.Quaternion(), []);
  const tmpMatrix = useMemo(() => new THREE.Matrix4(), []);
  const basePos = useMemo(() => position.clone().addScaledVector(normal, 0.006), [position, normal]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const damp = 1 - Math.pow(0.0001, delta);

    // Partial billboarding: blend outward-facing with camera-facing.
    tmpMatrix.lookAt(camera.position, groupRef.current.position, camera.up);
    camFacingQuat.setFromRotationMatrix(tmpMatrix);
    const blend = isOpen ? 1 : billboardStrength;
    groupRef.current.quaternion.slerpQuaternions(outwardQuat, camFacingQuat, blend);

    // Grow-in animation: each polaroid starts at scale 0 the moment it's
    // mounted (i.e. the beat that revealed it) and eases up to full size,
    // so photos appear on the heart piece by piece rather than popping in.
    const spawnDamp = 1 - Math.pow(0.0005, delta);
    spawnProgress.current = THREE.MathUtils.lerp(spawnProgress.current, 1, spawnDamp);

    // Hover / open scale pop — kept modest since the real "zoom" now
    // happens in the 2D lightbox, not in 3D space.
    const targetScale = isOpen ? 1.3 : hovered ? 1.35 : 1;
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, damp);
    groupRef.current.scale.setScalar(currentScale.current * spawnProgress.current);

    // Slight depth pop-out along the surface normal on hover/open.
    const popOut = isOpen ? 0.1 : hovered ? 0.08 : 0;
    const target = basePos.clone().addScaledVector(normal, popOut);
    groupRef.current.position.lerp(target, damp);
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (isOpen) {
          closeImage();
        } else {
          openImage(id, image);
        }
      }}
    >
      {/* Card body — gives the polaroid slight physical thickness
          instead of a flat, paper-thin plane. */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[FRAME_WIDTH, FRAME_HEIGHT, FRAME_DEPTH]} />
        <meshStandardMaterial color="#f7f3ea" roughness={0.85} metalness={0} />
      </mesh>

      {/* Photo inset */}
      <mesh position={[0, PHOTO_Y_OFFSET, FRAME_DEPTH / 2 + 0.001]}>
        <planeGeometry args={[PHOTO_WIDTH, PHOTO_HEIGHT]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.6}
          emissive={hovered || isOpen ? '#ffffff' : '#000000'}
          emissiveIntensity={hovered || isOpen ? 0.08 : 0}
        />
      </mesh>
    </group>
  );
}
