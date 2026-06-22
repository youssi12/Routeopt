-- ============================================================
-- RouteOpt – Intelligent Delivery Route Optimization Platform
-- Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS routeopt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE routeopt;

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role       ENUM('ADMIN','MANAGER','DISPATCHER') NOT NULL DEFAULT 'DISPATCHER',
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- ─── Warehouses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouses (
  id         CHAR(36)      NOT NULL DEFAULT (UUID()),
  name       VARCHAR(120)  NOT NULL,
  address    VARCHAR(500)  NOT NULL,
  latitude   DECIMAL(10,7) NOT NULL,
  longitude  DECIMAL(10,7) NOT NULL,
  is_active  BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_warehouses_coords (latitude, longitude)
) ENGINE=InnoDB;

-- ─── Vehicles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id                 CHAR(36)     NOT NULL DEFAULT (UUID()),
  license_plate      VARCHAR(20)  NOT NULL,
  model              VARCHAR(100),
  capacity_kg        DECIMAL(8,2) NOT NULL,
  fuel_consumption   DECIMAL(5,2) NOT NULL COMMENT 'L/100km',
  status             ENUM('AVAILABLE','IN_ROUTE','MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
  current_latitude   DECIMAL(10,7),
  current_longitude  DECIMAL(10,7),
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vehicles_plate (license_plate),
  INDEX idx_vehicles_status (status)
) ENGINE=InnoDB;

-- ─── Orders ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               CHAR(36)      NOT NULL DEFAULT (UUID()),
  warehouse_id     CHAR(36)      NOT NULL,
  customer_name    VARCHAR(120)  NOT NULL,
  delivery_address VARCHAR(500)  NOT NULL,
  latitude         DECIMAL(10,7) NOT NULL,
  longitude        DECIMAL(10,7) NOT NULL,
  weight_kg        DECIMAL(8,2)  NOT NULL,
  priority         ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
  deadline         DATETIME,
  status           ENUM('PENDING','ASSIGNED','IN_TRANSIT','DELIVERED','FAILED') NOT NULL DEFAULT 'PENDING',
  notes            TEXT,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_orders_warehouse (warehouse_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_priority (priority),
  INDEX idx_orders_deadline (deadline),
  CONSTRAINT fk_orders_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ─── Road Graph: Nodes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS road_nodes (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  latitude  DECIMAL(10,7)   NOT NULL,
  longitude DECIMAL(10,7)   NOT NULL,
  label     VARCHAR(100),
  PRIMARY KEY (id),
  INDEX idx_nodes_coords (latitude, longitude)
) ENGINE=InnoDB;

-- ─── Road Graph: Edges ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS road_edges (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_node_id      BIGINT UNSIGNED NOT NULL,
  destination_node_id BIGINT UNSIGNED NOT NULL,
  distance_km         DECIMAL(8,3)    NOT NULL,
  travel_time_minutes DECIMAL(7,2)    NOT NULL,
  road_type           ENUM('HIGHWAY','URBAN','RURAL') NOT NULL DEFAULT 'URBAN',
  bidirectional       BOOLEAN         NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  INDEX idx_edges_source (source_node_id),
  INDEX idx_edges_dest (destination_node_id),
  CONSTRAINT fk_edges_source FOREIGN KEY (source_node_id) REFERENCES road_nodes(id) ON DELETE CASCADE,
  CONSTRAINT fk_edges_dest   FOREIGN KEY (destination_node_id) REFERENCES road_nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Route Plans ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS route_plans (
  id                 CHAR(36)        NOT NULL DEFAULT (UUID()),
  vehicle_id         CHAR(36)        NOT NULL,
  warehouse_id       CHAR(36)        NOT NULL,
  distance_km        DECIMAL(10,3)   NOT NULL DEFAULT 0,
  duration_minutes   DECIMAL(8,2)    NOT NULL DEFAULT 0,
  fuel_cost          DECIMAL(10,2)   NOT NULL DEFAULT 0,
  optimization_score DECIMAL(5,2)    NOT NULL DEFAULT 0 COMMENT '0-100 efficiency score',
  algorithm_used     ENUM('NEAREST_NEIGHBOR','GENETIC','SIMULATED_ANNEALING') NOT NULL DEFAULT 'NEAREST_NEIGHBOR',
  status             ENUM('PLANNED','ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PLANNED',
  started_at         DATETIME,
  completed_at       DATETIME,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_routes_vehicle (vehicle_id),
  INDEX idx_routes_warehouse (warehouse_id),
  INDEX idx_routes_status (status),
  INDEX idx_routes_created (created_at),
  CONSTRAINT fk_routes_vehicle   FOREIGN KEY (vehicle_id)   REFERENCES vehicles(id)   ON DELETE RESTRICT,
  CONSTRAINT fk_routes_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ─── Route Stops ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS route_stops (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()),
  route_plan_id   CHAR(36)     NOT NULL,
  order_id        CHAR(36)     NOT NULL,
  sequence_number SMALLINT     NOT NULL,
  estimated_arrival DATETIME,
  actual_arrival    DATETIME,
  status          ENUM('PENDING','ARRIVED','DELIVERED','FAILED') NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (id),
  UNIQUE KEY uq_stop_route_seq (route_plan_id, sequence_number),
  INDEX idx_stops_route (route_plan_id),
  INDEX idx_stops_order (order_id),
  CONSTRAINT fk_stops_route FOREIGN KEY (route_plan_id) REFERENCES route_plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_stops_order FOREIGN KEY (order_id)      REFERENCES orders(id)      ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ─── Optimization Cache ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS optimization_cache (
  cache_key    VARCHAR(255) NOT NULL,
  algorithm    VARCHAR(50)  NOT NULL,
  input_hash   VARCHAR(64)  NOT NULL,
  result_json  LONGTEXT     NOT NULL,
  expires_at   DATETIME     NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cache_key),
  INDEX idx_cache_expires (expires_at)
) ENGINE=InnoDB;

-- ─── Audit Log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    CHAR(36),
  action     VARCHAR(100)    NOT NULL,
  entity     VARCHAR(50)     NOT NULL,
  entity_id  VARCHAR(36),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_audit_user   (user_id),
  INDEX idx_audit_entity (entity, entity_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_date   (created_at)
) ENGINE=InnoDB;
