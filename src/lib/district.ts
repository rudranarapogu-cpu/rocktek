import { useEffect, useState } from "react";

// Lightweight client-side "current district" preference. UI-only: it pre-fills
// the marketplace district filter so buyers see local sellers/transport first.
const KEY = "rocktek.district";
export const DEFAULT_DISTRICT = "Khammam";

// A small, curated list of districts RockTek currently operates in.
export const DISTRICTS = [
  "Khammam",
  "Hyderabad",
  "Warangal",
  "Karimnagar",
  "Nalgonda",
  "Suryapet",
  "Bengaluru",
  "Chennai",
];

const listeners = new Set<(d: string) => void>();

export function getDistrict(): string {
  if (typeof window === "undefined") return DEFAULT_DISTRICT;
  return window.localStorage.getItem(KEY) || DEFAULT_DISTRICT;
}

export function setDistrict(d: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, d);
  listeners.forEach((fn) => fn(d));
}

export function useDistrict(): [string, (d: string) => void] {
  const [district, setLocal] = useState(DEFAULT_DISTRICT);
  useEffect(() => {
    setLocal(getDistrict());
    const fn = (d: string) => setLocal(d);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return [district, setDistrict];
}
