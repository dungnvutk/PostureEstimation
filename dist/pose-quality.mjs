export const JOINT_MIN = 0.65;
// Preserve coordinates and raw model output separately; suppress invalid/offscreen
// points from the overlay instead of drawing confident-looking guessed limbs.
export function displayLandmarks(raw) {
  if (!raw) return null;
  return raw.map(p => ({...p, visibility:
    Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z) &&
    p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1 && Number.isFinite(p.visibility)
      ? p.visibility : 0
  }));
}
