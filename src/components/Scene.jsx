import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Heart from './Heart.jsx';
import HeartFromGLTF from './HeartFromGLTF.jsx'; // ← switch to this once your heart.glb loads cleanly
import { useFocus } from '../context/FocusContext.jsx';
import Loader from "./Loader.jsx";


const DEFAULT_CAMERA_POSITION = [0, 0, 4.2];

/**
 * Scene — the 3D world layer.
 *
 * Centered camera facing the heart, subtle ambient + directional
 * lighting, dark background for contrast, and a gentle, non-aggressive
 * auto-rotate that respects wherever the user has manually dragged
 * the view to (OrbitControls owns the camera fully — nothing resets
 * it back to a fixed position).
 */
export default function Scene() {
  const { closeImage } = useFocus();

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: DEFAULT_CAMERA_POSITION, fov: 45, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      // Clicking empty space (missing every object) also closes the
      // lightbox, as a convenience alongside the backdrop click.
      onPointerMissed={closeImage}
    >
      <color attach="background" args={['#ffafcc']} />
      <fog attach="fog" args={['#ffafcc', 6, 14]} />

      <ambientLight intensity={0.35} />
      <directionalLight
        position={[3, 4, 5]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-4, -2, -3]} intensity={0.4} color="#ff2d55" />

      <Suspense fallback={<Loader />}>
        <HeartFromGLTF />
        <Environment preset="city" />
      </Suspense>

      {/* Gentle, non-aggressive auto-rotate. Because nothing else ever
          touches camera.position or controls.target, dragging the
          view holds exactly where the user leaves it — autoRotate
          just keeps spinning forward from there rather than resetting. */}
      <OrbitControls
        enableDamping
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.6}
        minPolarAngle={Math.PI / 2 - 0.4}
        maxPolarAngle={Math.PI / 2 + 0.4}
      />
    </Canvas>
  );
}
