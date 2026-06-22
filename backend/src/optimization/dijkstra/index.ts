// ============================================================
// Dijkstra's Shortest Path Algorithm
// Time: O((V + E) log V) using a min-heap priority queue
// ============================================================

export interface GraphNode {
  id: number;
  latitude: number;
  longitude: number;
}

export interface GraphEdge {
  to: number;
  distanceKm: number;
  travelTimeMinutes: number;
}

export type AdjacencyList = Map<number, GraphEdge[]>;

export interface DijkstraResult {
  distance: number;
  travelTime: number;
  path: number[];
  visited: number;
}

class MinHeap {
  private heap: { node: number; dist: number }[] = [];

  push(node: number, dist: number): void {
    this.heap.push({ node, dist });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): { node: number; dist: number } | undefined {
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
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].dist <= this.heap[i].dist) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.heap[l].dist < this.heap[smallest].dist) smallest = l;
      if (r < n && this.heap[r].dist < this.heap[smallest].dist) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

export function dijkstra(
  graph: AdjacencyList,
  source: number,
  destination: number
): DijkstraResult | null {
  const dist = new Map<number, number>();
  const time = new Map<number, number>();
  const prev = new Map<number, number | null>();
  const heap = new MinHeap();
  let visited = 0;

  // Initialize
  for (const node of graph.keys()) {
    dist.set(node, Infinity);
    time.set(node, Infinity);
    prev.set(node, null);
  }

  dist.set(source, 0);
  time.set(source, 0);
  heap.push(source, 0);

  while (heap.size > 0) {
    const { node: u, dist: uDist } = heap.pop()!;
    visited++;

    if (u === destination) break;
    if (uDist > dist.get(u)!) continue; // stale entry

    for (const edge of graph.get(u) ?? []) {
      const alt = dist.get(u)! + edge.distanceKm;
      if (alt < dist.get(edge.to)!) {
        dist.set(edge.to, alt);
        time.set(edge.to, time.get(u)! + edge.travelTimeMinutes);
        prev.set(edge.to, u);
        heap.push(edge.to, alt);
      }
    }
  }

  if (dist.get(destination) === Infinity) return null;

  // Reconstruct path
  const path: number[] = [];
  let cur: number | null = destination;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }

  return {
    distance: Math.round(dist.get(destination)! * 100) / 100,
    travelTime: Math.round(time.get(destination)! * 100) / 100,
    path,
    visited,
  };
}
