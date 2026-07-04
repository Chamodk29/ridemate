'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LatLng { lat: number; lng: number; }

interface Props {
  cityCenter: [number, number] | null;
  initialFrom?: string;
  initialTo?: string;
  onRouteChange: (from: string, to: string) => void;
}

// Custom pin icons — avoids Leaflet's default icon path issues in Next.js
const makeIcon = (color: string, label: string) =>
  L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
        <div style="background:${color};color:white;font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,.3)">${label}</div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color}"></div>
      </div>`,
    iconSize: [60, 34],
    iconAnchor: [30, 34],
  });

const FROM_ICON = makeIcon('#10b981', 'FROM');
const TO_ICON   = makeIcon('#8b5cf6', 'TO');

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    // Build a short readable address from components
    const a = data.address ?? {};
    const parts = [
      a.road ?? a.pedestrian ?? a.suburb,
      a.suburb ?? a.neighbourhood ?? a.quarter,
      a.city ?? a.town ?? a.village ?? a.county,
    ].filter(Boolean);
    return parts.slice(0, 2).join(', ') || data.display_name?.split(',')[0] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

async function fetchRoute(from: LatLng, to: LatLng): Promise<{ path: [number, number][]; distance: string; duration: string } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.routes?.[0]) return null;
    const route = data.routes[0];
    const coords: [number, number][] = route.geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng]);
    const km = (route.distance / 1000).toFixed(1);
    const mins = Math.round(route.duration / 60);
    const duration = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
    return { path: coords, distance: `${km} km`, duration };
  } catch {
    return null;
  }
}

// Inner component that can use useMapEvents
function ClickHandler({ step, onPick }: { step: 'from' | 'to' | 'done'; onPick: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      if (step !== 'done') onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function RoutePickerMap({ cityCenter, onRouteChange }: Props) {
  const defaultCenter: [number, number] = cityCenter ?? [7.8731, 80.7718]; // Sri Lanka fallback
  const defaultZoom = cityCenter ? 13 : 7;

  const [step, setStep] = useState<'from' | 'to' | 'done'>('from');
  const [fromPoint, setFromPoint] = useState<LatLng | null>(null);
  const [toPoint, setToPoint]     = useState<LatLng | null>(null);
  const [fromAddr, setFromAddr]   = useState('');
  const [toAddr, setToAddr]       = useState('');
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  const handlePick = async (latlng: LatLng) => {
    setGeocoding(true);
    const addr = await reverseGeocode(latlng.lat, latlng.lng);

    if (step === 'from') {
      setFromPoint(latlng);
      setFromAddr(addr);
      setStep('to');
      setGeocoding(false);
    } else {
      setToPoint(latlng);
      setToAddr(addr);
      setStep('done');
      setGeocoding(false);
      // fetch route
      const route = await fetchRoute(fromPoint!, latlng);
      if (route) { setRoutePath(route.path); setRouteInfo({ distance: route.distance, duration: route.duration }); }
    }
  };

  // Propagate changes upward whenever both addresses are set
  useEffect(() => {
    if (fromAddr && toAddr) onRouteChange(fromAddr, toAddr);
  }, [fromAddr, toAddr]);

  const reset = () => {
    setStep('from'); setFromPoint(null); setToPoint(null);
    setFromAddr(''); setToAddr(''); setRoutePath([]); setRouteInfo(null);
    onRouteChange('', '');
  };

  const stepMessages = {
    from: '📍 Click the map to set your pickup point',
    to:   '🏁 Now click to set your destination',
    done: '✅ Route set — you can reset and pick again',
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200">
      {/* Step indicator */}
      <div className={`flex items-center justify-between px-3 py-2 text-xs font-medium border-b border-slate-200 ${
        step === 'done' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
      }`}>
        <span>{stepMessages[step]}</span>
        {step !== 'from' && (
          <button onClick={reset} className="text-slate-500 hover:text-rose-500 transition-colors font-medium">
            Reset
          </button>
        )}
      </div>

      {/* Address summary */}
      {(fromAddr || toAddr) && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs">
          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-semibold flex-shrink-0">FROM</span>
          <span className="text-slate-700 truncate flex-1">{fromAddr || '—'}</span>
          {toAddr && (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 text-slate-400 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded font-semibold flex-shrink-0">TO</span>
              <span className="text-slate-700 truncate flex-1">{toAddr}</span>
            </>
          )}
        </div>
      )}

      {/* Map */}
      <div className="relative">
        {geocoding && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-violet-700 font-medium bg-white px-4 py-2 rounded-xl shadow-md">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Getting address...
            </div>
          </div>
        )}

        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '280px', width: '100%' }}
          className={step !== 'done' ? 'cursor-crosshair' : ''}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickHandler step={step} onPick={handlePick} />
          {fromPoint && <Marker position={[fromPoint.lat, fromPoint.lng]} icon={FROM_ICON} />}
          {toPoint   && <Marker position={[toPoint.lat, toPoint.lng]}   icon={TO_ICON} />}
          {routePath.length > 0 && (
            <Polyline positions={routePath} pathOptions={{ color: '#8b5cf6', weight: 4, opacity: 0.8 }} />
          )}
        </MapContainer>
      </div>

      {/* Route info */}
      {routeInfo && (
        <div className="flex items-center justify-center gap-6 px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs font-medium text-slate-700">
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-violet-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {routeInfo.distance}
          </span>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-violet-500">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {routeInfo.duration} drive
          </span>
        </div>
      )}
    </div>
  );
}
