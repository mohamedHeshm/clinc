import { MAP_API_KEY } from "@/lib/map-config";

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
}

const GEOCODING_BASE = "https://api.mapbox.com/geocoding/v5/mapbox.places";

/** بحث نصي عن عنوان → قائمة اقتراحات */
export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  if (!query.trim() || !MAP_API_KEY) return [];

  const url = `${GEOCODING_BASE}/${encodeURIComponent(query)}.json?access_token=${MAP_API_KEY}&language=ar&limit=5&country=EG`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("تعذّر البحث عن العنوان");

  const data = await response.json();
  return (data.features ?? []).map((f: { place_name: string; center: [number, number] }) => ({
    address: f.place_name,
    longitude: f.center[0],
    latitude: f.center[1],
  }));
}

/** إحداثيات → أقرب عنوان نصّي (Reverse Geocoding) */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  if (!MAP_API_KEY) return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  const url = `${GEOCODING_BASE}/${longitude},${latitude}.json?access_token=${MAP_API_KEY}&language=ar&limit=1`;
  const response = await fetch(url);
  if (!response.ok) return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  const data = await response.json();
  return data.features?.[0]?.place_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}
