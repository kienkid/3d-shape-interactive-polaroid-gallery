import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useFocus } from '../context/FocusContext.jsx';

/**
 * Click interaction (camera-zoom variant): when a polaroid is
 * focused, eases the camera to a position just in front of it along
 * its outward normal, looking straight at it, and disables
 * auto-rotate so the shot holds still. Clearing focus (click the
 * same card again, or click empty space) eases back to the default
 * framing.
 */
export default function CameraRig({ controlsRef, defaultPosition, defaultTarget }) {
  const { camera } = useThree();
  const { focused } = useFocus();

  const desiredPos = useRef(new THREE.Vector3(...defaultPosition));
  const desiredTarget = useRef(new THREE.Vector3(...defaultTarget));

  useFrame((state, delta) => {
    if (focused) {
      desiredPos.current.copy(focused.position).addScaledVector(focused.normal, 1.1);
      desiredTarget.current.copy(focused.position);
      if (controlsRef.current) controlsRef.current.autoRotate = false;
    } else {
      desiredPos.current.set(...defaultPosition);
      desiredTarget.current.set(...defaultTarget);
      if (controlsRef.current) controlsRef.current.autoRotate = true;
    }

    const damp = 1 - Math.pow(0.0005, delta);
    camera.position.lerp(desiredPos.current, damp);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(desiredTarget.current, damp);
      controlsRef.current.update();
    }
  });

  return null;
}
