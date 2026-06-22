import { pool } from '../../database';
import { AdjacencyList, GraphEdge, GraphNode } from '../dijkstra';

export interface GraphData {
  adjacency: AdjacencyList;
  nodes:     Map<number, GraphNode>;
}

export async function buildGraph(): Promise<GraphData> {
  const [nodeRows] = await pool.query<any[]>('SELECT id, latitude, longitude FROM road_nodes');
  const [edgeRows] = await pool.query<any[]>(
    'SELECT source_node_id, destination_node_id, distance_km, travel_time_minutes, bidirectional FROM road_edges'
  );

  const nodes = new Map<number, GraphNode>();
  const adjacency: AdjacencyList = new Map();

  for (const row of nodeRows) {
    nodes.set(row.id, {
      id: row.id,
      latitude:  parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
    });
    adjacency.set(row.id, []);
  }

  for (const row of edgeRows) {
    const edge: GraphEdge = {
      to:                  row.destination_node_id,
      distanceKm:          parseFloat(row.distance_km),
      travelTimeMinutes:   parseFloat(row.travel_time_minutes),
    };
    adjacency.get(row.source_node_id)?.push(edge);

    if (row.bidirectional) {
      const reverseEdge: GraphEdge = {
        to:                row.source_node_id,
        distanceKm:        parseFloat(row.distance_km),
        travelTimeMinutes: parseFloat(row.travel_time_minutes),
      };
      adjacency.get(row.destination_node_id)?.push(reverseEdge);
    }
  }

  return { adjacency, nodes };
}
