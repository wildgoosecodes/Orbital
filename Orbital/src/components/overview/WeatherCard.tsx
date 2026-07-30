import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { fetchWeather, geocodeCity, weatherCodeInfo, type WeatherInfo } from '../../lib/weather';

interface WeatherCardProps {
  city: string | null;
}

type Status = 'loading' | 'ready' | 'no-location';

export default function WeatherCard({ city }: WeatherCardProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFromCity() {
      if (!city) {
        if (!cancelled) setStatus('no-location');
        return;
      }
      try {
        const coords = await geocodeCity(city);
        if (!coords) {
          if (!cancelled) setStatus('no-location');
          return;
        }
        const info = await fetchWeather(coords.lat, coords.lon);
        if (!cancelled) {
          setWeather(info);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) setStatus('no-location');
      }
    }

    if (!navigator.geolocation) {
      loadFromCity();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const info = await fetchWeather(position.coords.latitude, position.coords.longitude);
          if (!cancelled) {
            setWeather(info);
            setStatus('ready');
          }
        } catch {
          if (!cancelled) loadFromCity();
        }
      },
      () => {
        if (!cancelled) loadFromCity();
      },
      { timeout: 8000 },
    );

    return () => {
      cancelled = true;
    };
  }, [city]);

  if (status === 'loading') {
    return (
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center">
        <p className="text-sm text-slate-500">Loading weather…</p>
      </div>
    );
  }

  if (status === 'no-location') {
    return (
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2">
        <MapPin size={16} className="text-slate-600 flex-shrink-0" />
        <p className="text-sm text-slate-500">Add your city in your profile to see weather here.</p>
      </div>
    );
  }

  if (!weather) return null;
  const { label, icon: Icon } = weatherCodeInfo(weather.code);

  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-white leading-tight">{weather.temperature}°F</p>
        <p className="text-xs text-slate-500 truncate">{label}</p>
      </div>
    </div>
  );
}
