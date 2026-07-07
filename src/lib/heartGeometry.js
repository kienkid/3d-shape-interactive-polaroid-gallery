import * as THREE from 'three';

/**
 * Builds a 3D heart mesh geometry procedurally by extruding a 2D heart
 * silhouette (classic bezier heart curve) and beveling the edges so it
 * reads as a soft, organic volume rather than a flat cutout.
 *
 * This exists so the project runs out of the box with no external
 * assets. If you have a real `heart.glb` sculpted in Blender, drop it in
 * `public/models/heart.glb` and Heart.jsx will use that instead
 * (see the useGLTF branch there).
 */
export function createHeartGeometry() {
  const x = -0.3;
  const y = -0.3;

  const shape = new THREE.Shape();
  shape.moveTo(x + 0.25, y + 0.25);
  shape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
  shape.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
  shape.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 0.95);
  shape.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
  shape.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
  shape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

  const extrudeSettings = {
    depth: 0.45,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.1,
    bevelSegments: 8,
    curveSegments: 24
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // The bezier heart is authored upside-down and facing along +Z.
  // Flip it so the point of the heart hangs down and it faces the camera.
  geometry.rotateZ(Math.PI);
  geometry.rotateY(Math.PI);

  geometry.center();
  geometry.computeVertexNormals();

  // Normalize scale so the heart is roughly 1.6 units tall regardless
  // of the raw bezier dimensions.
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  const targetHeight = 1.6;
  const scaleFactor = targetHeight / size.y;
  geometry.scale(scaleFactor, scaleFactor, scaleFactor);
  geometry.center();

  return geometry;
}
