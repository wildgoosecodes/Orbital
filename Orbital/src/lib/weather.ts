import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface WeatherInfo {
  temperature: number;
  code: number;
}

export interface GeocodeResult {
  lat: number;
  lon: number;
}

/** Resolves a free-text city name to coordinates via Open-Meteo's free geocoding API. */
export async function geocodeCity(city: string): Promise<GeocodeResult | null> {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
  if (!res.ok) throw new Error('Could not look up that city.');
  const data = await res.json();
  const first = data.results?.[0];
  if (!first) return null;
  return { lat: first.latitude, lon: first.longitude };
}

/** Current conditions via Open-Meteo's free forecast API — no API key required. */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherInfo> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`,
  );
  if (!res.ok) throw new Error('Could not load the forecast.');
  const data = await res.json();
  return { temperature: Math.round(data.current.temperature_2m), code: data.current.weather_code };
}

/** Open-Meteo returns WMO weather codes — https://open-meteo.com/en/docs#weathervariables */
export const WEATHER_CODE_INFO: Record<number, { label: string; icon: LucideIcon }> = {
  0: { label: 'Clear sky', icon: Sun },
  1: { label: 'Mostly clear', icon: Sun },
  2: { label: 'Partly cloudy', icon: Cloud },
  3: { label: 'Overcast', icon: Cloud },
  45: { label: 'Fog', icon: CloudFog },
  48: { label: 'Fog', icon: CloudFog },
  51: { label: 'Light drizzle', icon: CloudDrizzle },
  53: { label: 'Drizzle', icon: CloudDrizzle },
  55: { label: 'Heavy drizzle', icon: CloudDrizzle },
  61: { label: 'Light rain', icon: CloudRain },
  63: { label: 'Rain', icon: CloudRain },
  65: { label: 'Heavy rain', icon: CloudRain },
  71: { label: 'Light snow', icon: CloudSnow },
  73: { label: 'Snow', icon: CloudSnow },
  75: { label: 'Heavy snow', icon: CloudSnow },
  80: { label: 'Rain showers', icon: CloudRain },
  81: { label: 'Rain showers', icon: CloudRain },
  82: { label: 'Violent showers', icon: CloudRain },
  95: { label: 'Thunderstorm', icon: CloudLightning },
  96: { label: 'Thunderstorm', icon: CloudLightning },
  99: { label: 'Thunderstorm', icon: CloudLightning },
};

export function weatherCodeInfo(code: number) {
  return WEATHER_CODE_INFO[code] ?? { label: 'Weather', icon: Cloud };
}
