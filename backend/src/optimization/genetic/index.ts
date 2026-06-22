// ============================================================
// Genetic Algorithm for Traveling Salesman Problem (TSP)
// Optimizes the visiting order of delivery stops
// ============================================================

export interface Stop {
  id: string;
  latitude: number;
  longitude: number;
}

export interface GeneticConfig {
  populationSize?: number;
  generations?:   number;
  mutationRate?:  number;
  eliteSize?:     number;
}

export interface GenerationStat {
  generation: number;
  bestDistance: number;
  avgDistance:  number;
}

export interface GeneticResult {
  bestRoute:    string[];          // ordered stop IDs
  bestDistance: number;
  generations:  GenerationStat[];
  improvement:  number;           // percent improvement over gen-0
}

const DEG = Math.PI / 180;

function dist(a: Stop, b: Stop): number {
  const dLat = (b.latitude  - a.latitude)  * DEG;
  const dLon = (b.longitude - a.longitude) * DEG;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * DEG) * Math.cos(b.latitude * DEG) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(s));
}

function totalDistance(route: Stop[]): number {
  let d = 0;
  for (let i = 0; i < route.length - 1; i++) d += dist(route[i], route[i + 1]);
  return d;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Order Crossover (OX) */
function crossover(parentA: Stop[], parentB: Stop[]): Stop[] {
  const n = parentA.length;
  const [start, end] = [
    Math.floor(Math.random() * n),
    Math.floor(Math.random() * n),
  ].sort((a, b) => a - b);

  const child = new Array<Stop | null>(n).fill(null);
  for (let i = start; i <= end; i++) child[i] = parentA[i];

  const remaining = parentB.filter((s) => !child.includes(s));
  let ri = 0;
  for (let i = 0; i < n; i++) {
    if (child[i] === null) child[i] = remaining[ri++];
  }
  return child as Stop[];
}

/** Swap mutation */
function mutate(route: Stop[], mutationRate: number): Stop[] {
  const r = [...route];
  for (let i = 0; i < r.length; i++) {
    if (Math.random() < mutationRate) {
      const j = Math.floor(Math.random() * r.length);
      [r[i], r[j]] = [r[j], r[i]];
    }
  }
  return r;
}

function rankRoutes(population: Stop[][]): { idx: number; fitness: number }[] {
  return population
    .map((r, idx) => ({ idx, fitness: 1 / totalDistance(r) }))
    .sort((a, b) => b.fitness - a.fitness);
}

function selection(
  ranked: { idx: number; fitness: number }[],
  eliteSize: number,
  popSize: number
): number[] {
  const selected: number[] = ranked.slice(0, eliteSize).map((r) => r.idx);
  const pool = ranked.map((r) => r.idx);
  while (selected.length < popSize) {
    selected.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return selected;
}

export function runGeneticAlgorithm(
  stops: Stop[],
  cfg: GeneticConfig = {}
): GeneticResult {
  const popSize     = cfg.populationSize ?? 100;
  const generations = cfg.generations   ?? 500;
  const mutRate     = cfg.mutationRate  ?? 0.01;
  const eliteSize   = cfg.eliteSize     ?? 20;

  if (stops.length <= 2) {
    return {
      bestRoute: stops.map((s) => s.id),
      bestDistance: stops.length === 2 ? dist(stops[0], stops[1]) : 0,
      generations: [],
      improvement: 0,
    };
  }

  // Initial population
  let population: Stop[][] = Array.from({ length: popSize }, () => shuffle(stops));
  const stats: GenerationStat[] = [];
  let firstBest = 0;

  for (let gen = 0; gen < generations; gen++) {
    const ranked = rankRoutes(population);

    if (gen === 0) firstBest = 1 / ranked[0].fitness;

    if (gen % 25 === 0 || gen === generations - 1) {
      const dists = population.map(totalDistance);
      stats.push({
        generation:   gen,
        bestDistance: Math.round((1 / ranked[0].fitness) * 100) / 100,
        avgDistance:  Math.round((dists.reduce((a, b) => a + b, 0) / dists.length) * 100) / 100,
      });
    }

    const selected  = selection(ranked, eliteSize, popSize);
    const elites    = selected.slice(0, eliteSize).map((i) => population[i]);
    const offspring = selected.slice(eliteSize).map((i) => {
      const j = selected[Math.floor(Math.random() * selected.length)];
      return mutate(crossover(population[i], population[j]), mutRate);
    });

    population = [...elites, ...offspring];
  }

  const finalRanked = rankRoutes(population);
  const best        = population[finalRanked[0].idx];
  const bestDist    = 1 / finalRanked[0].fitness;

  return {
    bestRoute:    best.map((s) => s.id),
    bestDistance: Math.round(bestDist * 100) / 100,
    generations:  stats,
    improvement:  Math.round(((firstBest - bestDist) / firstBest) * 10000) / 100,
  };
}
