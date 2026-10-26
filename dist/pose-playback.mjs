// Interpolate only adjacent detections; never bridge a missing-person frame.
export function poseAt(frames, time, sampleRate) {
  if (!frames.length) return null;
  let lo = 0, hi = frames.length;
  while (lo < hi) { const mid = (lo + hi) >>> 1; if (frames[mid].t < time) lo = mid + 1; else hi = mid; }
  const a = frames[Math.max(0, lo - 1)], b = frames[Math.min(lo, frames.length - 1)];
  const nearest = Math.abs(a.t - time) <= Math.abs(b.t - time) ? a : b;
  if (Math.abs(nearest.t - time) > 1.1 / sampleRate) return null;
  if (!a.p || !b.p || a === b || b.t - a.t > 1.5 / sampleRate) return nearest;
  const mix = Math.max(0, Math.min(1, (time - a.t) / (b.t - a.t)));
  const p = a.p.map((point, i) => ({
    ...point,
    x: point.x + (b.p[i].x - point.x) * mix,
    y: point.y + (b.p[i].y - point.y) * mix,
    z: point.z + (b.p[i].z - point.z) * mix,
    visibility: Math.min(point.visibility, b.p[i].visibility)
  }));
  return {...nearest, p};
}
