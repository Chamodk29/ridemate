'use client';

import { GenderPreference } from '@/types';

export interface FilterState {
  rideType: 'all' | 'offering' | 'looking';
  gender: GenderPreference | 'all';
  timeOfDay: 'all' | 'morning' | 'afternoon' | 'evening' | 'night';
}

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount: number;
  cityName?: string;
}

const TIME_OPTIONS = [
  { key: 'all', label: 'Any time', icon: '🕐' },
  { key: 'morning', label: 'Morning', sublabel: '5am–12pm', icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', sublabel: '12pm–5pm', icon: '☀️' },
  { key: 'evening', label: 'Evening', sublabel: '5pm–9pm', icon: '🌆' },
  { key: 'night', label: 'Night', sublabel: '9pm–5am', icon: '🌙' },
] as const;

const GENDER_OPTIONS = [
  { key: 'all', label: 'Any gender' },
  { key: 'any', label: 'Open to all' },
  { key: 'female', label: 'Female only' },
  { key: 'male', label: 'Male only' },
] as const;

const RIDE_TYPE_OPTIONS = [
  { key: 'all', label: 'All rides' },
  { key: 'offering', label: '🚗 Offering' },
  { key: 'looking', label: '🔍 Looking' },
] as const;

export default function SearchFilters({ filters, onChange, resultCount, cityName }: Props) {
  const set = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {cityName ? `Rides in ${cityName}` : 'All Rides'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {resultCount} result{resultCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => onChange({ rideType: 'all', gender: 'all', timeOfDay: 'all' })}
          className="text-xs text-violet-600 font-medium hover:text-violet-700"
        >
          Clear all
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Ride type */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ride Type</p>
          <div className="flex gap-2 flex-wrap">
            {RIDE_TYPE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => set({ rideType: opt.key as FilterState['rideType'] })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  filters.rideType === opt.key
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time of day */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Time of Day</p>
          <div className="grid grid-cols-2 gap-2">
            {TIME_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => set({ timeOfDay: opt.key as FilterState['timeOfDay'] })}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                  filters.timeOfDay === opt.key
                    ? 'bg-violet-50 border border-violet-300 text-violet-700'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>{opt.icon}</span>
                <div>
                  <p className="font-semibold">{opt.label}</p>
                  {'sublabel' in opt && <p className="text-slate-400 font-normal">{opt.sublabel}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Gender preference */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Gender Preference</p>
          <div className="flex gap-2 flex-wrap">
            {GENDER_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => set({ gender: opt.key as FilterState['gender'] })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  filters.gender === opt.key
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
