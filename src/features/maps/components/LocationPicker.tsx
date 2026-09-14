import { useEffect, useState } from "react";
import Map, { Marker, NavigationControl, type MapLayerMouseEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/useDebounce";
import { MAP_API_KEY, DEFAULT_MAP_CENTER } from "@/lib/map-config";
import { searchAddress, reverseGeocode, type GeocodeResult } from "../services/geocoding.service";

export interface PickedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationPickerProps {
  value: PickedLocation | null;
  onChange: (location: PickedLocation) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 400);

  const viewState = value
    ? { latitude: value.latitude, longitude: value.longitude, zoom: 15 }
    : {
        latitude: DEFAULT_MAP_CENTER.latitude,
        longitude: DEFAULT_MAP_CENTER.longitude,
        zoom: DEFAULT_MAP_CENTER.zoom,
      };

  // بحث فعلي عن العنوان بعد الـ debounce — Effect واحد بسيط وواضح
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    searchAddress(debouncedQuery)
      .then((results) => {
        if (!cancelled) setSuggestions(results);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  async function selectCoordinates(latitude: number, longitude: number) {
    const address = await reverseGeocode(latitude, longitude);
    onChange({ latitude, longitude, address });
  }

  async function handleMapClick(event: MapLayerMouseEvent) {
    await selectCoordinates(event.lngLat.lat, event.lngLat.lng);
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع الحالي");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await selectCoordinates(position.coords.latitude, position.coords.longitude);
        setIsLocating(false);
      },
      () => {
        toast.error("تعذّر الوصول لموقعك الحالي. تأكد من تفعيل صلاحية الموقع.");
        setIsLocating(false);
      }
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ابحث عن عنوان..."
          className="pr-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded border border-border bg-surface shadow-elevated">
            {suggestions.map((s) => (
              <button
                key={`${s.latitude}-${s.longitude}`}
                type="button"
                className="block w-full px-3 py-2.5 text-right text-sm hover:bg-surface-muted"
                onClick={() => {
                  onChange(s);
                  setSearchQuery("");
                  setSuggestions([]);
                }}
              >
                {s.address}
              </button>
            ))}
          </div>
        )}
        {isSearching && <p className="mt-1 text-xs text-muted-foreground">جارٍ البحث...</p>}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleUseCurrentLocation}
        disabled={isLocating}
      >
        <LocateFixed className="h-4 w-4" />
        {isLocating ? "جارٍ التحديد..." : "استخدام موقعي الحالي"}
      </Button>

      <div className="h-64 overflow-hidden rounded-lg border border-border">
        {MAP_API_KEY ? (
          <Map
            mapboxAccessToken={MAP_API_KEY}
            initialViewState={viewState}
            latitude={viewState.latitude}
            longitude={viewState.longitude}
            zoom={viewState.zoom}
            onClick={handleMapClick}
            mapStyle="mapbox://styles/mapbox/light-v11"
            style={{ width: "100%", height: "100%" }}
          >
            <NavigationControl position="top-left" showCompass={false} />
            {value && (
              <Marker
                latitude={value.latitude}
                longitude={value.longitude}
                draggable
                onDragEnd={(e) => selectCoordinates(e.lngLat.lat, e.lngLat.lng)}
              >
                <MapPin className="h-8 w-8 -translate-y-4 fill-primary text-primary" />
              </Marker>
            )}
          </Map>
        ) : (
          <div className="flex h-full items-center justify-center bg-surface-muted px-4 text-center text-sm text-muted-foreground">
            الخريطة غير متاحة حاليًا — تأكد من ضبط VITE_MAP_API_KEY
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">العنوان</Label>
        <Input
          id="address"
          value={value?.address ?? ""}
          onChange={(e) =>
            value
              ? onChange({ ...value, address: e.target.value })
              : onChange({
                  latitude: DEFAULT_MAP_CENTER.latitude,
                  longitude: DEFAULT_MAP_CENTER.longitude,
                  address: e.target.value,
                })
          }
          placeholder="اكتب العنوان يدويًا أو اختره من الخريطة"
        />
      </div>
    </div>
  );
}
