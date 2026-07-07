import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { poissonFilter } from './poissonFilter.js';

/**
 * Samples evenly distributed points across a mesh's surface.
 *
 * Input:  a BufferGeometry (heart.glb mesh geometry, or the procedural
 *         fallback geometry).
 * Output: an array of { position: Vector3, normal: Vector3 } describing
 *         where particles should sit and which way they face.
 *
 * Pipeline:
 *   1. Oversample the surface with MeshSurfaceSampler (weighted by
 *      triangle area, so density starts uniform per-area already).
 *   2. Run a Poisson-disc-like rejection filter over the oversampled
 *      pool to remove clustering and enforce a minimum spacing,
 *      guaranteeing the final set reads as evenly distributed rather
 *      than randomly noisy.
 *
 * @param {THREE.BufferGeometry} geometry
 * @param {object} options
 * @param {number} options.count - desired number of final particles
 * @param {number} options.minDistance - minimum spacing between particles
 * @param {number} options.oversampleFactor - how many raw candidates to draw before filtering
 */
export function sampleSurfacePoints(
  geometry,
  { count = 1200, minDistance = 0.045, oversampleFactor = 6 } = {}
) {
  // MeshSurfaceSampler needs a Mesh (it reads geometry + optional material).
  const tempMesh = new THREE.Mesh(geometry);
  const sampler = new MeshSurfaceSampler(tempMesh).build();

  const rawCount = count * oversampleFactor;
  const candidates = new Array(rawCount);

  const position = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i < rawCount; i++) {
    sampler.sample(position, normal);
    candidates[i] = {
      position: position.clone(),
      normal: normal.clone().normalize()
    };
  }

  const filtered = poissonFilter(candidates, minDistance, count);

  return filtered;
}
