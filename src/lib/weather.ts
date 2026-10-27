"use client";
import { useEffect, useState } from "react";

// Live weather for Malé from Open-Meteo (free, no API key, CORS-friendly). Cached for 15 minutes per tab.
export interface Weather { temp: number; code: number; wind: number; isDay: boolean; label: string; emoji: string; rainy: boolean }

const URL_ = "https://api.open-meteo.com/v1/forecast?latitude=4.1755&longitude=73.5093&current=temperature_2m,weather_code,wind_speed_10m,is_day&timezone=Indian%2FMaldives";

function describe(code: number, isDay: boolean): [string, string] {
  if (code === 0) return ["Clear", isDay ? "☀️" : "✨"];
  if (code <= 2) return ["Partly cloudy", isDay ? "⛅" : "☁️"];
  if (code === 3) return ["Overcast", "☁️"];
  if (code <= 48) return ["Misty", "🌫️"];
  if (code <= 57) return ["Drizzle", "🌦️"];
  if (code <= 67) return ["Rain", "🌧️"];
  if (code <= 82) return ["Showers", "🌧️"];
  return ["Thunderstorm", "⛈️"];
}

let cache: { at: number; p: Promise<Weather | null> } | null = null;
export function loadWeather(): Promise<Weather | null> {
  if (cache && Date.now() - cache.at < 15 * 60_000) return cache.p;
  const p = fetch(URL_).then((r) => r.json()).then((d) => {
    const c = d.current;
    const [label, emoji] = describe(c.weather_code, c.is_day === 1);
    return { temp: Math.round(c.temperature_2m), code: c.weather_code, wind: Math.round(c.wind_speed_10m), isDay: c.is_day === 1, label, emoji, rainy: c.weather_code >= 51 && c.weather_code !== 71 };
  }).catch(() => null);
  cache = { at: Date.now(), p };
  return p;
}

export function useWeather() {
  const [w, setW] = useState<Weather | null>(null);
  useEffect(() => { loadWeather().then(setW); }, []);
  return w;
}
