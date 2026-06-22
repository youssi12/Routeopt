'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function warehouseIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:8px;
      background:#1a97e6;border:2px solid #fff;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 12px rgba(26,151,230,0.5);
      font-size:14px;
    ">🏭</div>`,
    iconSize:   [32, 32],
    iconAnchor: [16, 16],
  });
}

function orderColor(status: string) {
  switch (status) {
    case 'PENDING':    return '#f59e0b';
    case 'ASSIGNED':   return '#3b82f6';
    case 'IN_TRANSIT': return '#8b5cf6';
    case 'DELIVERED':  return '#22c55e';
    case 'FAILED':     return '#ef4444';
    default:           return '#64748b';
  }
}

function AutoCenter({ warehouses }: { warehouses: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (warehouses.length > 0) {
      const lat = warehouses.reduce((s, w) => s + parseFloat(w.latitude), 0) / warehouses.length;
      const lng = warehouses.reduce((s, w) => s + parseFloat(w.longitude), 0) / warehouses.length;
      map.setView([lat, lng], 12);
    }
  }, [warehouses, map]);
  return null;
}

interface Props {
  warehouses: any[];
  orders:     any[];
}

export default function MapView({ warehouses, orders }: Props) {
  const defaultCenter: [number, number] = [48.8566, 2.3522];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <AutoCenter warehouses={warehouses} />

      {/* Warehouse markers */}
      {warehouses.map((w: any) => (
        <Marker
          key={w.id}
          position={[parseFloat(w.latitude), parseFloat(w.longitude)]}
          icon={warehouseIcon()}
        >
          <Popup>
            <div style={{ color: '#f1f5f9', minWidth: 160 }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>🏭 {w.name}</p>
              <p style={{ color: '#94a3b8', fontSize: 12 }}>{w.address}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Order markers */}
      {orders.map((o: any) => (
        <CircleMarker
          key={o.id}
          center={[parseFloat(o.latitude), parseFloat(o.longitude)]}
          radius={6}
          pathOptions={{
            color:       orderColor(o.status),
            fillColor:   orderColor(o.status),
            fillOpacity: 0.85,
            weight:      2,
          }}
        >
          <Popup>
            <div style={{ color: '#f1f5f9', minWidth: 180 }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>📦 {o.customer_name}</p>
              <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>{o.delivery_address}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                <span style={{ background: '#1e2d45', padding: '2px 8px', borderRadius: 9999, fontSize: 11 }}>{o.status}</span>
                <span style={{ background: '#1e2d45', padding: '2px 8px', borderRadius: 9999, fontSize: 11 }}>{o.priority}</span>
                <span style={{ background: '#1e2d45', padding: '2px 8px', borderRadius: 9999, fontSize: 11 }}>{o.weight_kg} kg</span>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
