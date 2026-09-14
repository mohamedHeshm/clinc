import { useEffect } from "react";
import { divIcon, latLngBounds } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { cn } from "@/lib/utils";
import { DEFAULT_MAP_CENTER } from "@/lib/map-config";

export interface MapPoint {
  latitude: number;
  longitude: number;
  label: string;
  description?: string;
  tone: "patient" | "doctor" | "nurse" | "destination";
}

interface MedicalMapProps {
  points?: MapPoint[];
  onMapClick?: (point: { latitude: number; longitude: number }) => void;
  className?: string;
  height?: string;
  readonly?: boolean;
}

const MARKER_SYMBOLS: Record<MapPoint["tone"], string> = { patient: "●", doctor: "✚", nurse: "✦", destination: "⌖" };

function MapViewport({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      const [point] = points;
      if (point) map.setView([point.latitude, point.longitude], 14);
      return;
    }
    map.fitBounds(latLngBounds(points.map((point) => [point.latitude, point.longitude])), { padding: [32, 32] });
  }, [map, points]);
  return null;
}

function MapClickHandler({ onMapClick }: Pick<MedicalMapProps, "onMapClick">) {
  useMapEvents({ click: (event) => onMapClick?.({ latitude: event.latlng.lat, longitude: event.latlng.lng }) });
  return null;
}

export function MedicalMap({ points = [], onMapClick, className, height = "18rem", readonly = false }: MedicalMapProps) {
  const validPoints = points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  const [firstPoint] = validPoints;
  const center: LatLngExpression = firstPoint ? [firstPoint.latitude, firstPoint.longitude] : [DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude];
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-surface", className)} style={{ height }}>
      <MapContainer center={center} zoom={DEFAULT_MAP_CENTER.zoom} scrollWheelZoom={!readonly} className="h-full w-full" aria-label="خريطة الموقع">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapViewport points={validPoints} />
        {!readonly && <MapClickHandler onMapClick={onMapClick} />}
        {validPoints.map((point) => (
          <Marker key={`${point.tone}-${point.latitude}-${point.longitude}`} position={[point.latitude, point.longitude]} icon={divIcon({ className: "medical-map-icon", html: `<span class="medical-map-icon__dot medical-map-icon__dot--${point.tone}">${MARKER_SYMBOLS[point.tone]}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] })}>
            <Popup><strong>{point.label}</strong>{point.description && <p>{point.description}</p>}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
