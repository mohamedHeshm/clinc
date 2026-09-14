/**
 * إعداد مزود الخرائط.
 * المزود الافتراضي: Mapbox (راجع قرار المرحلة 1 في 01-architecture.md).
 * تم تجريد الإعداد هنا بحيث يمكن لاحقًا دعم مزود بديل عبر VITE_MAP_PROVIDER
 * دون تعديل باقي الكود في features/maps.
 */

export const MAP_PROVIDER = (import.meta.env.VITE_MAP_PROVIDER ?? "mapbox") as
  | "mapbox"
  | "google";

export const MAP_API_KEY = import.meta.env.VITE_MAP_API_KEY as string;

if (!MAP_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "VITE_MAP_API_KEY غير موجود — خرائط الزيارات المنزلية لن تعمل. راجع .env.example"
  );
}

// مركز افتراضي للخريطة (القاهرة) يُستخدم قبل تحديد موقع المستخدم
export const DEFAULT_MAP_CENTER = {
  latitude: 30.0444,
  longitude: 31.2357,
  zoom: 11,
};
