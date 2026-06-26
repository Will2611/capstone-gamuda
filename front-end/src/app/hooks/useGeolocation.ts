import { useCallback, useState } from "react";

export type LngLat = [number, number];

export function useGeolocation(fallback: LngLat) {
  const [userCenter, setUserCenter] = useState<LngLat | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCenter([pos.coords.longitude, pos.coords.latitude]);
        setIsLocating(false);
      },
      (err) => {
        setError(err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return {
    userCenter,
    defaultCenter: userCenter ?? fallback,
    locate,
    isLocating,
    error,
  };
}
