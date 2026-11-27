import React, {useMemo, useState} from 'react';
import {Building2, Clock, MapPin, Phone, Search, ShieldCheck} from 'lucide-react';
import {CoverageSelector} from '../components/CoverageSelector.tsx';
import {SpatialProximityMap} from '../components/SpatialProximityMap.tsx';
import {usePortal} from '../context/PortalContext.tsx';
import {CITIES} from '../data/seedData.ts';
import {BloodGroup} from '../types/bloodconnect.ts';
import {
  BLOOD_GROUPS,
  formatExactTimestamp,
  formatTimeAgo,
  haversineKm,
} from '../utils/compatibility.ts';

export function BloodBanksPage() {
  const {
    bloodBanks,
    donors,
    coverageScope,
    selectedCity,
    navigate,
  } = usePortal();

  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<BloodGroup | 'ALL'>('ALL');
  const [only24x7, setOnly24x7] = useState(false);

  const cityMeta = useMemo(
    () => CITIES.find((c) => c.name === selectedCity) ?? CITIES[0],
    [selectedCity]
  );

  const filteredBanks = useMemo(() => {
    return bloodBanks
      .filter((b) => {
        if (coverageScope === 'karnataka' && b.state !== 'Karnataka') return false;
        if (coverageScope === 'city' && b.city !== selectedCity) return false;
        if (only24x7 && !b.is24x7) return false;
        if (groupFilter !== 'ALL' && b.stock[groupFilter].confirmedUnits <= 0) return false;
        if (query.trim()) {
          const q = query.trim().toLowerCase();
          const match =
            b.name.toLowerCase().includes(q) ||
            b.city.toLowerCase().includes(q) ||
            b.address.toLowerCase().includes(q) ||
            b.licenseNumber.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .map((bank) => ({
        bank,
        distanceKm: haversineKm(cityMeta.lat, cityMeta.lng, bank.lat, bank.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [bloodBanks, coverageScope, selectedCity, only24x7, groupFilter, query, cityMeta]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-2 min-w-0">
          <p className="text-xs font-medium text-red-700">Licensed Transfusion Centres</p>
          <h1 className="font-display font-bold text-3xl text-slate-900">Nearby Blood Banks</h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Locate licensed government, charitable, and hospital blood banks sorted by distance with
            verified stock timestamps and direct telephone desks.
          </p>
        </div>

        <div className="w-full lg:w-auto lg:shrink-0 max-w-full">
          <CoverageSelector variant="compact" alwaysShowCitySelect citySelectPrefix="Near" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-5 relative">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bank name, address, or license ID..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          />
        </div>

        <div className="md:col-span-4 flex items-center gap-2">
          <label htmlFor="bank-group-filter" className="text-xs font-medium text-slate-600 shrink-0">
            In-stock group:
          </label>
          <select
            id="bank-group-filter"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value as BloodGroup | 'ALL')}
            className="w-full h-10 px-3 text-xs font-medium bg-white border border-slate-300 rounded-lg"
          >
            <option value="ALL">All Blood Groups</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g} Confirmed Available
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3 flex items-center justify-start md:justify-end">
          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={only24x7}
              onChange={(e) => setOnly24x7(e.target.checked)}
              className="rounded border-slate-300 text-red-600 focus:ring-red-600"
            />
            <span>24×7 Emergency Desk Only</span>
          </label>
        </div>
      </div>

      {/* Interactive Map */}
      <SpatialProximityMap
        centerCityName={selectedCity}
        coverageScope={coverageScope}
        donors={donors.filter((d) =>
          coverageScope === 'karnataka'
            ? d.state === 'Karnataka'
            : coverageScope === 'city'
            ? d.city === selectedCity
            : true
        )}
        bloodBanks={filteredBanks.map((x) => x.bank)}
        title="Blood Bank Locations & Verified Donor Coverage"
      />

      {/* Blood Bank Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredBanks.map(({bank, distanceKm}) => {
          const totalConfirmed = BLOOD_GROUPS.reduce(
            (sum, g) => sum + bank.stock[g].confirmedUnits,
            0
          );

          return (
            <div
              key={bank.id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{bank.type}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{bank.licenseNumber}</span>
                      {bank.is24x7 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-emerald-800">24×7 Open</span>
                        </>
                      )}
                    </div>
                    <h2 className="font-display font-bold text-lg text-slate-900">{bank.name}</h2>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md tabular-nums shrink-0">
                    {distanceKm} km
                  </span>
                </div>

                <p className="text-xs text-slate-600 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{bank.address}</span>
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 pt-1">
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    {bank.phone}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Verified {formatTimeAgo(bank.lastVerifiedAt)}</span>
                  </span>
                </div>

                {/* Compact Confirmed Unit Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-3 border-t border-slate-100">
                  {BLOOD_GROUPS.map((g) => {
                    const count = bank.stock[g].confirmedUnits;
                    return (
                      <div
                        key={g}
                        className={`text-center py-1.5 px-1 rounded-md border ${
                          count === 0
                            ? 'bg-slate-50 border-slate-100 text-slate-400'
                            : count <= 2
                            ? 'bg-red-50 border-red-200 text-red-800'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <p className="text-[10px] font-semibold">{g}</p>
                        <p className="text-xs font-mono font-bold tabular-nums">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 inline-flex items-center gap-1.5 font-mono tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  {formatExactTimestamp(bank.lastVerifiedAt)} · {totalConfirmed} confirmed units
                </span>
                <button
                  type="button"
                  onClick={() => navigate('blood-availability')}
                  className="inline-flex items-center gap-1.5 font-semibold text-red-700 hover:text-red-800 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reserve Units →</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
