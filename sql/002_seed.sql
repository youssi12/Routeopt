-- ============================================================
-- RouteOpt – Seed Data
-- ============================================================
USE routeopt;

-- ─── Admin user (password: Admin@123) ────────────────────────
INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'System Admin',  'admin@routeopt.io',      '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsOf6bD5l8r8s1oKjZnZoFpF8AGm', 'ADMIN'),
  ('a0000000-0000-0000-0000-000000000002', 'Fleet Manager', 'manager@routeopt.io',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsOf6bD5l8r8s1oKjZnZoFpF8AGm', 'MANAGER'),
  ('a0000000-0000-0000-0000-000000000003', 'Dispatcher One', 'dispatch@routeopt.io',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsOf6bD5l8r8s1oKjZnZoFpF8AGm', 'DISPATCHER');

-- ─── Warehouses ──────────────────────────────────────────────
INSERT INTO warehouses (id, name, address, latitude, longitude) VALUES
  ('w0000001-0000-0000-0000-000000000001', 'Central Hub',    '1 Logistics Ave, Metro City', 48.8566, 2.3522),
  ('w0000001-0000-0000-0000-000000000002', 'North Depot',    '42 North Industrial Rd',      48.9200, 2.3400),
  ('w0000001-0000-0000-0000-000000000003', 'South Warehouse', '7 Port Road, South District', 48.7900, 2.3700);

-- ─── Vehicles ────────────────────────────────────────────────
INSERT INTO vehicles (id, license_plate, model, capacity_kg, fuel_consumption, status) VALUES
  ('v0000001-0000-0000-0000-000000000001', 'RT-001-AA', 'Mercedes Sprinter',  1200.00, 9.5,  'AVAILABLE'),
  ('v0000001-0000-0000-0000-000000000002', 'RT-002-BB', 'Ford Transit',        900.00, 10.2, 'AVAILABLE'),
  ('v0000001-0000-0000-0000-000000000003', 'RT-003-CC', 'Iveco Daily',        1500.00, 11.0, 'AVAILABLE'),
  ('v0000001-0000-0000-0000-000000000004', 'RT-004-DD', 'Renault Master',      800.00, 8.8,  'MAINTENANCE'),
  ('v0000001-0000-0000-0000-000000000005', 'RT-005-EE', 'Volkswagen Crafter', 1100.00, 9.1,  'AVAILABLE');

-- ─── Road Graph: Nodes (simplified city grid) ────────────────
INSERT INTO road_nodes (id, latitude, longitude, label) VALUES
  (1,  48.8566, 2.3522, 'Central'),
  (2,  48.8600, 2.3600, 'Node_2'),
  (3,  48.8650, 2.3700, 'Node_3'),
  (4,  48.8700, 2.3800, 'Node_4'),
  (5,  48.8750, 2.3900, 'Node_5'),
  (6,  48.8800, 2.4000, 'East_Terminal'),
  (7,  48.8550, 2.3450, 'Node_7'),
  (8,  48.8500, 2.3400, 'Node_8'),
  (9,  48.8450, 2.3350, 'Node_9'),
  (10, 48.8400, 2.3300, 'South_Gate'),
  (11, 48.8620, 2.3550, 'Node_11'),
  (12, 48.8680, 2.3650, 'Node_12'),
  (13, 48.8720, 2.3750, 'Node_13'),
  (14, 48.9200, 2.3400, 'North_Depot'),
  (15, 48.7900, 2.3700, 'South_Warehouse');

-- ─── Road Graph: Edges ───────────────────────────────────────
INSERT INTO road_edges (source_node_id, destination_node_id, distance_km, travel_time_minutes, road_type) VALUES
  (1,  2,  1.2,  3.5, 'URBAN'),
  (2,  3,  1.5,  4.0, 'URBAN'),
  (3,  4,  1.3,  3.8, 'URBAN'),
  (4,  5,  1.1,  3.2, 'URBAN'),
  (5,  6,  1.4,  4.1, 'URBAN'),
  (1,  7,  0.9,  2.8, 'URBAN'),
  (7,  8,  0.8,  2.5, 'URBAN'),
  (8,  9,  0.7,  2.2, 'URBAN'),
  (9,  10, 0.6,  1.9, 'URBAN'),
  (2,  11, 0.5,  1.5, 'URBAN'),
  (3,  12, 0.6,  1.8, 'URBAN'),
  (4,  13, 0.7,  2.0, 'URBAN'),
  (11, 12, 0.8,  2.4, 'URBAN'),
  (12, 13, 0.9,  2.6, 'URBAN'),
  (1,  14, 8.5,  14.0, 'HIGHWAY'),
  (1,  15, 7.2,  12.5, 'HIGHWAY');

-- ─── Sample Orders ───────────────────────────────────────────
INSERT INTO orders (id, warehouse_id, customer_name, delivery_address, latitude, longitude, weight_kg, priority, deadline, status) VALUES
  ('o0000001-0000-0000-0000-000000000001', 'w0000001-0000-0000-0000-000000000001', 'Alice Martin',   '12 Rue de la Paix',    48.8680, 2.3320, 45.5,  'HIGH',   DATE_ADD(NOW(), INTERVAL 4 HOUR),  'PENDING'),
  ('o0000001-0000-0000-0000-000000000002', 'w0000001-0000-0000-0000-000000000001', 'Bob Dupont',     '34 Av des Champs',     48.8738, 2.2950, 80.0,  'MEDIUM', DATE_ADD(NOW(), INTERVAL 8 HOUR),  'PENDING'),
  ('o0000001-0000-0000-0000-000000000003', 'w0000001-0000-0000-0000-000000000001', 'Carol Lefevre',  '56 Blvd Haussmann',    48.8773, 2.3282, 120.0, 'LOW',    DATE_ADD(NOW(), INTERVAL 24 HOUR), 'PENDING'),
  ('o0000001-0000-0000-0000-000000000004', 'w0000001-0000-0000-0000-000000000002', 'David Moreau',   '78 Rue Oberkampf',     48.8643, 2.3796, 55.0,  'HIGH',   DATE_ADD(NOW(), INTERVAL 3 HOUR),  'PENDING'),
  ('o0000001-0000-0000-0000-000000000005', 'w0000001-0000-0000-0000-000000000002', 'Emma Bernard',   '90 Rue de Rivoli',     48.8600, 2.3400, 30.0,  'MEDIUM', DATE_ADD(NOW(), INTERVAL 6 HOUR),  'PENDING'),
  ('o0000001-0000-0000-0000-000000000006', 'w0000001-0000-0000-0000-000000000001', 'Franck Leblanc', '15 Place Vendôme',     48.8675, 2.3301, 95.0,  'HIGH',   DATE_ADD(NOW(), INTERVAL 2 HOUR),  'PENDING'),
  ('o0000001-0000-0000-0000-000000000007', 'w0000001-0000-0000-0000-000000000003', 'Grace Simon',    '22 Rue du Faubourg',   48.8530, 2.3600, 200.0, 'LOW',    DATE_ADD(NOW(), INTERVAL 48 HOUR), 'PENDING'),
  ('o0000001-0000-0000-0000-000000000008', 'w0000001-0000-0000-0000-000000000001', 'Henri Petit',    '33 Av de la République',48.8631,2.3708, 75.0,  'MEDIUM', DATE_ADD(NOW(), INTERVAL 12 HOUR), 'ASSIGNED');
