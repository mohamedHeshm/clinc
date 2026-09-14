export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
}

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

/** بحث نصي عن عنوان → قائمة اقتراحات */
export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({ q: query.trim(), format: "jsonv2", limit: "5", countrycodes: "eg", "accept-language": "ar" });
  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`);
  if (!response.ok) throw new Error("تعذّر البحث عن العنوان");

  const data = (await response.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return data.map((place) => ({
    address: place.display_name,
    latitude: Number(place.lat),
    longitude: Number(place.lon),
  }));
}

/** إحداثيات → أقرب عنوان نصّي (Reverse Geocoding) */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), format: "jsonv2", "accept-language": "ar" });
  const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`);
  if (!response.ok) return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  const data = (await response.json()) as { display_name?: string };
  return data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}
