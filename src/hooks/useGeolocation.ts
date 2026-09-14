import { useState } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  status: "idle" | "loading" | "success" | "error";
  errorMessage: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    status: "idle",
    errorMessage: null,
  });

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, status: "error", errorMessage: "المتصفح لا يدعم تحديد الموقع" }));
      return;
    }
    setState((s) => ({ ...s, status: "loading" }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          status: "success",
          errorMessage: null,
        });
      },
      () => {
        setState((s) => ({
          ...s,
          status: "error",
          errorMessage: "تعذّر الوصول لموقعك. تأكد من تفعيل صلاحية الموقع في المتصفح.",
        }));
      }
    );
  };

  return { ...state, requestLocation };
}
