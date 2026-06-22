# RouteOpt – Intelligent Delivery Route Optimization Platform

A production-quality logistics optimization platform built with Node.js, Next.js, MySQL 8, and Redis. The centrepiece is a dedicated **Optimization Engine** implementing Dijkstra, A\*, Nearest Neighbour, Simulated Annealing, and a full **Genetic Algorithm** for TSP route optimization.

---

## Tech Stack

| Layer       | Technology |
|-------------|-----------|
| Frontend    | Next.js 14, TypeScript, Tailwind CSS, Leaflet, React Query, Chart.js |
| Backend     | Node.js, Express.js, TypeScript, JWT |
| Database    | MySQL 8 |
| Cache       | Redis 7 |
| DevOps      | Docker, Docker Compose |

---

## Quick Start (Docker)

```bash
# 1. Clone
git clone <repo-url>
cd routeopt

# 2. Start everything
docker compose up -d

# 3. Access
#    Frontend  → http://localhost:3000
#    API       → http://localhost:4000
#    Swagger   → http://localhost:4000/api-docs
```

### Default credentials
| Email | Password | Role |
|-------|----------|------|
| admin@routeopt.io | Admin@123 | ADMIN |
| manager@routeopt.io | Admin@123 | MANAGER |
| dispatch@routeopt.io | Admin@123 | DISPATCHER |

---

## Local Development (without Docker)

### Prerequisites
- Node.js 20+
- MySQL 8 running locally
- Redis running locally

### Backend

```bash
cd backend
npm install
cp .env.example .env       # edit DB/Redis credentials
npm run dev                # starts on :4000
```

### Database setup

```bash
mysql -u root -p < sql/001_schema.sql
mysql -u root -p < sql/002_seed.sql
```

### Frontend

```bash
cd frontend
npm install
# create .env.local:
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
npm run dev                # starts on :3000
```

---

## Project Structure

```
routeopt/
├── sql/
│   ├── 001_schema.sql       # Full DB schema
│   └── 002_seed.sql         # Sample data
│
├── backend/src/
│   ├── app.ts               # Express entry point
│   ├── config/              # Environment config
│   ├── database/            # MySQL pool
│   ├── middleware/          # JWT auth, role guard
│   ├── services/            # Redis cache service
│   ├── modules/
│   │   ├── auth/            # Login, register, profile
│   │   ├── warehouses/      # Warehouse CRUD
│   │   ├── vehicles/        # Fleet management
│   │   ├── orders/          # Order management
│   │   ├── routes/          # Route planning + generation
│   │   └── analytics/       # Dashboard KPIs, trends
│   └── optimization/
│       ├── dijkstra/        # Shortest path O((V+E)logV)
│       ├── astar/           # A* with Haversine heuristic
│       ├── tsp/             # Nearest Neighbor + Simulated Annealing
│       ├── genetic/         # Full GA: selection, crossover, mutation
│       └── graph/           # Graph builder + vehicle assignment engine
│
└── frontend/src/
    ├── app/
    │   ├── dashboard/       # KPI cards + charts
    │   ├── map/             # Live Leaflet map
    │   ├── warehouses/      # Warehouse management
    │   ├── vehicles/        # Fleet view
    │   ├── orders/          # Order table with filters
    │   ├── routes/          # Route generation & management
    │   ├── optimization/    # Algorithm comparison + GA evolution chart
    │   ├── analytics/       # Full analytics with charts
    │   └── login/           # JWT login
    ├── components/
    │   ├── layout/AppShell  # Sidebar navigation
    │   └── maps/MapView     # Leaflet with dark tiles
    ├── hooks/useAuth.tsx    # Auth context
    └── lib/api.ts           # Axios API client
```

---

## REST API

### Authentication
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
```

### Core Resources
```
GET/POST        /api/warehouses
GET/DELETE      /api/warehouses/:id
GET/POST        /api/vehicles
PATCH           /api/vehicles/:id
GET/POST        /api/orders
PATCH           /api/orders/:id
GET             /api/routes
POST            /api/routes/generate
GET             /api/routes/:id
```

### Optimization Engine
```
POST /api/optimization/dijkstra          # Shortest path
POST /api/optimization/astar             # A* pathfinding
POST /api/optimization/genetic           # GA with evolution stats
POST /api/optimization/compare           # Compare all TSP algorithms
POST /api/optimization/vehicle-assignment # Smart vehicle-to-order assignment
```

### Analytics
```
GET /api/analytics/dashboard
GET /api/analytics/orders-trend
GET /api/analytics/vehicles
GET /api/analytics/routes
GET /api/analytics/costs
```

---

## Optimization Engine

### Dijkstra (Shortest Path)
- Adjacency list + binary min-heap priority queue
- Time: O((V + E) log V)
- Used for point-to-point routing between road graph nodes

### A* Search
- Haversine distance as heuristic h(n)
- Avoids exploring unnecessary nodes vs Dijkstra
- Time: O(E log V) in practice, significantly faster for geo-routing

### Nearest Neighbour (TSP heuristic)
- Greedy: always visit the closest unvisited stop
- Time: O(n²) — fast, good baseline

### Simulated Annealing (TSP)
- Probabilistic swap mutations with decreasing temperature
- Escapes local optima; better than nearest neighbour on larger inputs

### Genetic Algorithm (TSP)
- Population of chromosomes (delivery orderings)
- Order Crossover (OX) operator preserves valid permutations
- Fitness: `1 / totalDistance`
- Configurable: population size, generations, mutation rate, elite size
- Returns generation-by-generation evolution data for visualization

### Vehicle Assignment
- Constraint-aware bin-packing
- Orders scored by priority + deadline urgency
- Best-fit bin selection to minimize wasted capacity

---

## Database Schema

| Table | Purpose |
|-------|---------|
| users | Authentication, roles (ADMIN/MANAGER/DISPATCHER) |
| warehouses | Depot locations with geo-coordinates |
| vehicles | Fleet with capacity and fuel consumption |
| orders | Delivery orders with geo-coordinates, weight, priority, deadline |
| road_nodes | Points in the road graph |
| road_edges | Weighted connections between nodes |
| route_plans | Generated routes with algorithm used and cost |
| route_stops | Ordered delivery stops per route |
| optimization_cache | DB-level optimization result cache |
| audit_logs | Full audit trail |

---

## Caching Strategy (Redis)

| Cache Key | TTL | Content |
|-----------|-----|---------|
| `vehicles:all` | 60s | All vehicles list |
| `analytics:dashboard` | 60s | KPI dashboard |
| `analytics:*` | 60–300s | Analytics summaries |
| `opt:dijkstra:s:d` | 1h | Dijkstra results |
| `opt:astar:s:d` | 1h | A* results |
| `opt:genetic:<hash>` | 10min | GA results |

---

## Roles & Permissions

| Action | ADMIN | MANAGER | DISPATCHER |
|--------|-------|---------|------------|
| Full system access | ✅ | | |
| Manage vehicles & orders | ✅ | ✅ | |
| Generate routes | ✅ | ✅ | |
| View routes & analytics | ✅ | ✅ | ✅ |
| Assign deliveries | ✅ | ✅ | ✅ |
