export const MAP_PROVIDER = import.meta.env.VITE_MAP_PROVIDER ?? "osm";

// مركز افتراضي للخريطة (القاهرة) يُستخدم قبل تحديد موقع المستخدم
export const DEFAULT_MAP_CENTER = {
  latitude: 30.0444,
  longitude: 31.2357,
  zoom: 11,
};
