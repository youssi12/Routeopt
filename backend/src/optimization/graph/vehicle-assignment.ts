// ============================================================
// Vehicle Assignment Engine
// Constraint-aware bin-packing with priority & deadline scoring
// ============================================================

export interface AssignableOrder {
  id: string;
  weight_kg: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline?: Date | null;
  latitude: number;
  longitude: number;
  warehouse_id: string;
}

export interface AssignableVehicle {
  id: string;
  capacity_kg: number;
  warehouse_id?: string;
}

export interface AssignmentResult {
  assignments: Record<string, string[]>; // vehicleId -> orderIds
  unassigned:  string[];
  utilization: Record<string, number>;   // vehicleId -> %
}

const PRIORITY_WEIGHT = { HIGH: 100, MEDIUM: 50, LOW: 10 };

function urgencyScore(order: AssignableOrder): number {
  let score = PRIORITY_WEIGHT[order.priority];
  if (order.deadline) {
    const hoursLeft = (order.deadline.getTime() - Date.now()) / 3_600_000;
    if (hoursLeft < 2) score += 200;
    else if (hoursLeft < 6) score += 100;
    else if (hoursLeft < 24) score += 50;
  }
  return score;
}

export function assignVehicles(
  orders: AssignableOrder[],
  vehicles: AssignableVehicle[]
): AssignmentResult {
  // Sort orders by urgency desc
  const sorted = [...orders].sort((a, b) => urgencyScore(b) - urgencyScore(a));

  const loads: Record<string, number>   = {};
  const assigned: Record<string, string[]> = {};
  const available = vehicles.filter((v) => v.capacity_kg > 0);

  for (const v of available) {
    loads[v.id]    = 0;
    assigned[v.id] = [];
  }

  const unassigned: string[] = [];

  for (const order of sorted) {
    // Find best-fit vehicle (smallest remaining capacity that still fits)
    let bestVehicle: AssignableVehicle | null = null;
    let bestRemaining = Infinity;

    for (const v of available) {
      const remaining = v.capacity_kg - loads[v.id];
      if (remaining >= order.weight_kg && remaining < bestRemaining) {
        bestRemaining = remaining;
        bestVehicle   = v;
      }
    }

    if (bestVehicle) {
      assigned[bestVehicle.id].push(order.id);
      loads[bestVehicle.id] += order.weight_kg;
    } else {
      unassigned.push(order.id);
    }
  }

  const utilization: Record<string, number> = {};
  for (const v of available) {
    utilization[v.id] = Math.round((loads[v.id] / v.capacity_kg) * 10000) / 100;
  }

  return { assignments: assigned, unassigned, utilization };
}
