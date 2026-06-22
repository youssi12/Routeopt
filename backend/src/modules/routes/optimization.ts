import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { cache } from '../../services/redis';
import { dijkstra } from '../../optimization/dijkstra';
import { astar } from '../../optimization/astar';
import { runGeneticAlgorithm } from '../../optimization/genetic';
import { nearestNeighbor, simulatedAnnealing } from '../../optimization/tsp';
import { assignVehicles } from '../../optimization/graph/vehicle-assignment';
import { buildGraph } from '../../optimization/graph/builder';
import crypto from 'crypto';

const router = Router();
router.use(authenticate);

// ─── Dijkstra ────────────────────────────────────────────────
router.post('/dijkstra', async (req: Request, res: Response) => {
  const { source, destination } = req.body;
  const cacheKey = `opt:dijkstra:${source}:${destination}`;
  const cached = await cache.get(cacheKey);
  if (cached) { res.json({ ...cached as object, cached: true }); return; }

  const { adjacency } = await buildGraph();
  const result = dijkstra(adjacency, Number(source), Number(destination));
  if (!result) { res.status(404).json({ error: 'No path found' }); return; }

  await cache.set(cacheKey, result, 3600);
  res.json(result);
});

// ─── A* ──────────────────────────────────────────────────────
router.post('/astar', async (req: Request, res: Response) => {
  const { source, destination } = req.body;
  const cacheKey = `opt:astar:${source}:${destination}`;
  const cached = await cache.get(cacheKey);
  if (cached) { res.json({ ...cached as object, cached: true }); return; }

  const { adjacency, nodes } = await buildGraph();
  const result = astar(adjacency, nodes, Number(source), Number(destination));
  if (!result) { res.status(404).json({ error: 'No path found' }); return; }

  await cache.set(cacheKey, result, 3600);
  res.json(result);
});

// ─── Genetic Algorithm ───────────────────────────────────────
router.post('/genetic', async (req: Request, res: Response) => {
  const { stops, config: algoCfg } = req.body;
  const hash = crypto.createHash('md5').update(JSON.stringify(stops)).digest('hex');
  const cacheKey = `opt:genetic:${hash}`;
  const cached = await cache.get(cacheKey);
  if (cached) { res.json({ ...cached as object, cached: true }); return; }

  const t0 = Date.now();
  const result = runGeneticAlgorithm(stops, algoCfg);
  const elapsed = Date.now() - t0;

  const response = { ...result, runtimeMs: elapsed };
  await cache.set(cacheKey, response, 600);
  res.json(response);
});

// ─── Compare Algorithms ──────────────────────────────────────
router.post('/compare', async (req: Request, res: Response) => {
  const { stops } = req.body;

  const run = <T>(fn: () => T): { result: T; runtimeMs: number } => {
    const t0 = Date.now();
    const result = fn();
    return { result, runtimeMs: Date.now() - t0 };
  };

  const nn = run(() => nearestNeighbor(stops));
  const sa = run(() => simulatedAnnealing(stops));
  const ga = run(() => runGeneticAlgorithm(stops, { generations: 300 }));

  res.json({
    nearest_neighbor: {
      distance: nn.result.distance,
      route:    nn.result.route,
      runtimeMs: nn.runtimeMs,
    },
    simulated_annealing: {
      distance: sa.result.distance,
      route:    sa.result.route,
      runtimeMs: sa.runtimeMs,
    },
    genetic: {
      distance: ga.result.bestDistance,
      route:    ga.result.bestRoute,
      improvement: ga.result.improvement,
      runtimeMs: ga.runtimeMs,
    },
  });
});

// ─── Vehicle Assignment ──────────────────────────────────────
router.post('/vehicle-assignment', async (req: Request, res: Response) => {
  const { orders, vehicles } = req.body;
  const result = assignVehicles(orders, vehicles);
  res.json(result);
});

export default router;
