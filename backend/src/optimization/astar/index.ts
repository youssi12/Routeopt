// ============================================================
// A* Search Algorithm
// Uses Haversine distance as heuristic h(n)
// More efficient than Dijkstra for geo-spatial routing
// ============================================================

import { AdjacencyList, GraphNode, DijkstraResult } from '../dijkstra';

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

function haversine(a: GraphNode, b: GraphNode): number {
  const dLat = (b.latitude - a.latitude) * DEG_TO_RAD;
  const dLon = (b.longitude - a.longitude) * DEG_TO_RAD;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const c =
    sinLat * sinLat +
    Math.cos(a.latitude * DEG_TO_RAD) *
      Math.cos(b.latitude * DEG_TO_RAD) *
      sinLon * sinLon;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(c));
}

class AStarHeap {
  private heap: { node: number; f: number }[] = [];

  push(node: number, f: number): void {
    this.heap.push({ node, f });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): { node: number; f: number } | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  get size(): number {
    return this.heap.length;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.heap[p].f <= this.heap[i].f) break;
      [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]];
      i = p;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let s = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l].f < this.heap[s].f) s = l;
      if (r < n && this.heap[r].f < this.heap[s].f) s = r;
      if (s === i) break;
      [this.heap[s], this.heap[i]] = [this.heap[i], this.heap[s]];
      i = s;
    }
  }
}

export function astar(
  graph: AdjacencyList,
  nodes: Map<number, GraphNode>,
  source: number,
  destination: number
): DijkstraResult | null {
  const dest = nodes.get(destination);
  if (!dest) return null;

  const gScore = new Map<number, number>();
  const fScore = new Map<number, number>();
  const time   = new Map<number, number>();
  const prev   = new Map<number, number | null>();
  const heap   = new AStarHeap();
  const closed = new Set<number>();
  let visited  = 0;

  for (const n of graph.keys()) {
    gScore.set(n, Infinity);
    fScore.set(n, Infinity);
    time.set(n, Infinity);
    prev.set(n, null);
  }

  gScore.set(source, 0);
  time.set(source, 0);
  fScore.set(source, haversine(nodes.get(source)!, dest));
  heap.push(source, fScore.get(source)!);

  while (heap.size > 0) {
    const { node: u } = heap.pop()!;
    visited++;
    if (closed.has(u)) continue;
    closed.add(u);

    if (u === destination) break;

    for (const edge of graph.get(u) ?? []) {
      if (closed.has(edge.to)) continue;
      const tentG = gScore.get(u)! + edge.distanceKm;
      if (tentG < gScore.get(edge.to)!) {
        gScore.set(edge.to, tentG);
        time.set(edge.to, time.get(u)! + edge.travelTimeMinutes);
        prev.set(edge.to, u);
        const neighborNode = nodes.get(edge.to)!;
        fScore.set(edge.to, tentG + haversine(neighborNode, dest));
        heap.push(edge.to, fScore.get(edge.to)!);
      }
    }
  }

  if (gScore.get(destination) === Infinity) return null;

  const path: number[] = [];
  let cur: number | null = destination;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }

  return {
    distance: Math.round(gScore.get(destination)! * 100) / 100,
    travelTime: Math.round(time.get(destination)! * 100) / 100,
    path,
    visited,
  };
}
