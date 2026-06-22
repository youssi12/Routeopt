// ============================================================
// TSP Heuristics: Nearest Neighbor & Simulated Annealing
// ============================================================

import { Stop } from '../genetic';

const DEG = Math.PI / 180;

export function haversine(a: Stop, b: Stop): number {
  const dLat = (b.latitude  - a.latitude)  * DEG;
  const dLon = (b.longitude - a.longitude) * DEG;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * DEG) * Math.cos(b.latitude * DEG) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(s));
}

export function totalDist(route: Stop[]): number {
  let d = 0;
  for (let i = 0; i < route.length - 1; i++) d += haversine(route[i], route[i + 1]);
  return d;
}

// ─── Nearest Neighbor ────────────────────────────────────────
export function nearestNeighbor(stops: Stop[]): { route: string[]; distance: number } {
  if (stops.length === 0) return { route: [], distance: 0 };

  const unvisited = [...stops];
  const route: Stop[] = [unvisited.shift()!];

  while (unvisited.length > 0) {
    const last = route[route.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const d = haversine(last, unvisited[i]);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    }
    route.push(unvisited.splice(nearestIdx, 1)[0]);
  }

  return {
    route: route.map((s) => s.id),
    distance: Math.round(totalDist(route) * 100) / 100,
  };
}

// ─── Simulated Annealing ─────────────────────────────────────
export function simulatedAnnealing(
  stops: Stop[],
  {
    initialTemp  = 1000,
    coolingRate  = 0.995,
    minTemp      = 1,
    iterations   = 1000,
  } = {}
): { route: string[]; distance: number } {
  if (stops.length <= 2) {
    return {
      route: stops.map((s) => s.id),
      distance: stops.length === 2 ? haversine(stops[0], stops[1]) : 0,
    };
  }

  let current  = [...stops];
  let best     = [...current];
  let curDist  = totalDist(current);
  let bestDist = curDist;
  let temp     = initialTemp;

  while (temp > minTemp) {
    for (let i = 0; i < iterations; i++) {
      const a = Math.floor(Math.random() * current.length);
      const b = Math.floor(Math.random() * current.length);
      const next = [...current];
      [next[a], next[b]] = [next[b], next[a]];

      const nextDist = totalDist(next);
      const delta    = nextDist - curDist;

      if (delta < 0 || Math.random() < Math.exp(-delta / temp)) {
        current = next;
        curDist = nextDist;
        if (curDist < bestDist) {
          best     = [...current];
          bestDist = curDist;
        }
      }
    }
    temp *= coolingRate;
  }

  return {
    route: best.map((s) => s.id),
    distance: Math.round(bestDist * 100) / 100,
  };
}
