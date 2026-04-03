'use client';

import { useState, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { CityResult } from '@/types';

interface Props {
  value: string;
  onChange: (city: CityResult) => void;
  onClear: () => void;
  placeholder?: string;
  size?: 'sm' | 'lg';
}

export default function CitySearch({ value, onChange, onClear, placeholder = 'Search city...', size = 'lg' }: Props) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch cities from Nominatim
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedQuery)}&format=json&limit=8&addressdetails=1&featuretype=city`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en', 'User-Agent': 'Ridemate/1.0' },
      }
    )
      .then(res => res.json())
      .then((data: Array<{
        display_name: string;
        address: { city?: string; town?: string; village?: string; country?: string; country_code?: string };
        lat: string;
        lon: string;
      }>) => {
        const seen = new Set<string>();
        const parsed: CityResult[] = data
          .map(item => {
            const cityName =
              item.address?.city ||
              item.address?.town ||
              item.address?.village ||
              item.display_name.split(',')[0];
            const country = item.address?.country || '';
            const countryCode = item.address?.country_code?.toUpperCase() || '';
            return {
              name: cityName,
              country,
              countryCode,
              displayName: `${cityName}, ${country}`,
              lat: item.lat,
              lon: item.lon,
            };
          })
          .filter(item => {
            const key = item.displayName.toLowerCase();
            if (seen.has(key) || !item.name || !item.country) return false;
            seen.add(key);
            return true;
          });
        setResults(parsed);
        setOpen(parsed.length > 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  const handleSelect = (city: CityResult) => {
    setQuery(city.displayName);
    setOpen(false);
    onChange(city);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    onClear();
    inputRef.current?.focus();
  };

  const isLg = size === 'lg';

  return (
    <div ref={containerRef} className="relative w-full">
      <div className={`flex items-center gap-2 bg-white border rounded-2xl transition-all ${
        open ? 'border-violet-400 ring-2 ring-violet-100' : 'border-slate-200 hover:border-slate-300'
      } ${isLg ? 'px-4 py-3' : 'px-3 py-2'}`}>
        {/* Search icon */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          className={`flex-shrink-0 text-slate-400 ${isLg ? 'w-5 h-5' : 'w-4 h-4'}`}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={`flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400 ${isLg ? 'text-base' : 'text-sm'}`}
        />

        {/* Loading spinner */}
        {loading && (
          <svg className="animate-spin w-4 h-4 text-violet-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}

        {/* Clear button */}
        {query && !loading && (
          <button onClick={handleClear}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs text-slate-400 font-medium">
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {results.map((city, i) => (
              <li key={i}>
                <button
                  onClick={() => handleSelect(city)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-violet-50 transition-colors text-left group"
                >
                  {/* Flag emoji via country code */}
                  <span className="text-lg flex-shrink-0 w-7 text-center">
                    {city.countryCode
                      ? String.fromCodePoint(...city.countryCode.split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
                      : '🌍'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-violet-700">
                      {city.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{city.country}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                    className="w-3.5 h-3.5 text-slate-300 group-hover:text-violet-400 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
