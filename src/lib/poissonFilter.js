/**
 * Greedy blue-noise (Poisson-disc-like) filter.
 *
 * Given a large pool of candidate points, this walks them in random
 * order and only keeps a candidate if it is at least `minDistance`
 * away from every point already accepted. This removes clustering
 * from raw random surface sampling and produces an even, organic
 * spread without the cost of a full Poisson-disc grid solve.
 *
 * @param {Array<{position: THREE.Vector3, normal: THREE.Vector3}>} candidates
 * @param {number} minDistance - minimum allowed distance between accepted points
 * @param {number} maxCount - stop once this many points are accepted
 * @returns {Array<{position: THREE.Vector3, normal: THREE.Vector3}>}
 */
export function poissonFilter(candidates, minDistance, maxCount) {
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const accepted = [];
  const minDistSq = minDistance * minDistance;

  for (let i = 0; i < shuffled.length && accepted.length < maxCount; i++) {
    const candidate = shuffled[i];
    let farEnough = true;

    for (let j = 0; j < accepted.length; j++) {
      const distSq = candidate.position.distanceToSquared(accepted[j].position);
      if (distSq < minDistSq) {
        farEnough = false;
        break;
      }
    }

    if (farEnough) {
      accepted.push(candidate);
    }
  }

  return accepted;
}
