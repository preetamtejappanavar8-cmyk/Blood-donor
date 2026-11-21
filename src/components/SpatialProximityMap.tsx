import React, {useMemo, useState} from 'react';
import {Building2, MapPin, Navigation, UserCheck} from 'lucide-react';
import {CITIES} from '../data/seedData.ts';
import {BloodBank, CoverageScope, Donor} from '../types/bloodconnect.ts';
import {formatTimeAgo, haversineKm} from '../utils/compatibility.ts';

interface SpatialProximityMapProps {
  centerCityName: string;
  coverageScope: CoverageScope;
  donors: Donor[];
  bloodBanks: BloodBank[];
  onSelectDonor?: (donor: Donor) => void;
  onSelectBank?: (bank: BloodBank) => void;
  title?: string;
}

export function SpatialProximityMap({
  centerCityName,
  coverageScope,
  donors,
  bloodBanks,
  onSelectDonor,
  onSelectBank,
  title = 'Regional Proximity Explorer',
}: SpatialProximityMapProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const centerCity = useMemo(
    () => CITIES.find((c) => c.name === centerCityName) ?? CITIES[0],
    [centerCityName]
  );

  // Geographic projection bounds adjusted by coverage scope
  const bounds = useMemo(() => {
    if (coverageScope === 'all_india') {
      return {minLat: 7.5, maxLat: 31.5, minLng: 68.5, maxLng: 92.5, radiusLabel: 'Pan-India'};
    }
    if (coverageScope === 'karnataka') {
      return {minLat: 11.4, maxLat: 18.2, minLng: 74.0, maxLng: 78.6, radiusLabel: 'Karnataka'};
    }
    // Single city zoom (~25km radius around selected city)
    const span = 0.16;
    return {
      minLat: centerCity.lat - span,
      maxLat: centerCity.lat + span,
      minLng: centerCity.lng - span,
      maxLng: centerCity.lng + span,
      radiusLabel: `${centerCity.name} Metro (25 km)`,
    };
  }, [coverageScope, centerCity]);

  const project = (lat: number, lng: number) => {
    const xPct = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const yPct = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
    return {
      x: Math.min(94, Math.max(6, xPct)),
      y: Math.min(92, Math.max(8, yPct)),
    };
  };

  // Strictly show ONLY verified donors on the proximity map as confirmed donor markers
  const verifiedDonors = useMemo(
    () => donors.filter((d) => d.verificationStatus === 'verified'),
    [donors]
  );

  const selectedDonor = verifiedDonors.find((d) => d.id === activeId);
  const selectedBank = bloodBanks.find((b) => b.id === activeId);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-red-600" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <span className="text-xs text-slate-500">· {bounds.radiusLabel}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" aria-hidden="true" />
            Verified Donors ({verifiedDonors.length})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 inline-block" aria-hidden="true" />
            Blood Banks ({bloodBanks.length})
          </span>
        </div>
      </div>

      <div className="relative h-72 sm:h-80 bg-slate-50 select-none overflow-hidden">
        {/* Clean Coordinate Grid & Distance Rings */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {[20, 40, 60, 80].map((pos) => (
            <React.Fragment key={pos}>
              <line x1={pos} y1={0} x2={pos} y2={100} stroke="#E2E8F0" strokeWidth="0.3" />
              <line x1={0} y1={pos} x2={100} y2={pos} stroke="#E2E8F0" strokeWidth="0.3" />
            </React.Fragment>
          ))}
          {coverageScope === 'city' && (
            <>
              <circle
                cx="50"
                cy="50"
                r="18"
                fill="none"
                stroke="#CBD5E1"
                strokeDasharray="1.5 1.5"
                strokeWidth="0.4"
              />
              <circle
                cx="50"
                cy="50"
                r="36"
                fill="none"
                stroke="#CBD5E1"
                strokeDasharray="1.5 1.5"
                strokeWidth="0.4"
              />
            </>
          )}
        </svg>

        {/* City reference labels in regional/national views */}
        {coverageScope !== 'city' &&
          CITIES.filter((c) => (coverageScope === 'karnataka' ? c.inKarnataka : true)).map((city) => {
            const pt = project(city.lat, city.lng);
            return (
              <div
                key={city.name}
                style={{left: `${pt.x}%`, top: `${pt.y}%`}}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              >
                <span className="text-[10px] font-medium text-slate-400 tracking-tight whitespace-nowrap">
                  {city.name}
                </span>
              </div>
            );
          })}

        {/* Selected Center Marker */}
        {coverageScope === 'city' && (
          <div
            style={{left: '50%', top: '50%'}}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
          >
            <MapPin className="w-5 h-5 text-slate-400" aria-hidden="true" />
            <span className="text-[10px] font-medium text-slate-500 mt-0.5">{centerCity.name}</span>
          </div>
        )}

        {/* Blood Bank Markers */}
        {bloodBanks.map((bank) => {
          const pt = project(bank.lat, bank.lng);
          const isSelected = activeId === bank.id;
          return (
            <button
              key={bank.id}
              type="button"
              onClick={() => {
                setActiveId(bank.id);
                onSelectBank?.(bank);
              }}
              style={{left: `${pt.x}%`, top: `${pt.y}%`}}
              title={`${bank.name} (${bank.city})`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center w-7 h-7 rounded-md border transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
                isSelected
                  ? 'bg-slate-900 text-white border-white scale-110 shadow-md'
                  : 'bg-white text-slate-900 border-slate-400 hover:border-slate-900 hover:scale-105 shadow-xs'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          );
        })}

        {/* Verified Donor Markers */}
        {verifiedDonors.map((donor) => {
          const pt = project(donor.lat, donor.lng);
          const isSelected = activeId === donor.id;
          return (
            <button
              key={donor.id}
              type="button"
              onClick={() => {
                setActiveId(donor.id);
                onSelectDonor?.(donor);
              }}
              style={{left: `${pt.x}%`, top: `${pt.y}%`}}
              title={`${donor.name} · ${donor.bloodGroup} (${donor.locality}, ${donor.city})`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-[11px] font-mono font-semibold border transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
                isSelected
                  ? 'bg-red-700 text-white border-white scale-110 shadow-md'
                  : donor.availability === 'available'
                  ? 'bg-red-600 text-white border-red-700 hover:bg-red-700 hover:scale-105'
                  : 'bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              {donor.bloodGroup}
            </button>
          );
        })}
      </div>

      {/* Selected Pin Inspection Footer */}
      {(selectedDonor || selectedBank) && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {selectedDonor && (
            <>
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                <div>
                  <span className="font-semibold text-slate-900">{selectedDonor.name}</span>
                  <span className="text-slate-500">
                    {' '}
                    · {selectedDonor.bloodGroup} · {selectedDonor.locality}, {selectedDonor.city} ·{' '}
                    {haversineKm(
                      centerCity.lat,
                      centerCity.lng,
                      selectedDonor.lat,
                      selectedDonor.lng
                    )}{' '}
                    km from {centerCity.name}
                  </span>
                </div>
              </div>
              <span className="font-mono text-slate-600 tabular-nums">
                Verified {formatTimeAgo(selectedDonor.verifiedAt ?? selectedDonor.registeredAt)}
              </span>
            </>
          )}
          {selectedBank && (
            <>
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-slate-800 shrink-0" aria-hidden="true" />
                <div>
                  <span className="font-semibold text-slate-900">{selectedBank.name}</span>
                  <span className="text-slate-500">
                    {' '}
                    · {selectedBank.city} ·{' '}
                    {haversineKm(centerCity.lat, centerCity.lng, selectedBank.lat, selectedBank.lng)}{' '}
                    km from {centerCity.name}
                  </span>
                </div>
              </div>
              <span className="font-mono text-slate-600 tabular-nums">
                Stock verified {formatTimeAgo(selectedBank.lastVerifiedAt)}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
