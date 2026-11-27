import React, {useMemo} from 'react';
import {ChevronDown, Compass, Globe, MapPin} from 'lucide-react';
import {usePortal} from '../context/PortalContext.tsx';
import {CITIES} from '../data/seedData.ts';
import {CoverageScope} from '../types/bloodconnect.ts';

interface CoverageSelectorProps {
  variant?: 'hero' | 'compact';
  alwaysShowCitySelect?: boolean;
  citySelectPrefix?: string;
}

const QUICK_CITY_NAMES = [
  'Bengaluru',
  'Mysuru',
  'Mangaluru',
  'Mumbai',
  'New Delhi',
  'Hyderabad',
  'Chennai',
];

export function CoverageSelector({
  variant = 'compact',
  alwaysShowCitySelect = false,
  citySelectPrefix = '',
}: CoverageSelectorProps) {
  const {coverageScope, setCoverageScope, selectedCity, setSelectedCity} = usePortal();

  const selectedCityMeta = useMemo(
    () => CITIES.find((c) => c.name === selectedCity) ?? CITIES[0],
    [selectedCity]
  );

  const handleScopeSelect = (nextScope: CoverageScope) => {
    setCoverageScope(nextScope);
    if (nextScope === 'karnataka') {
      const isKarnataka = CITIES.find((c) => c.name === selectedCity)?.inKarnataka;
      if (!isKarnataka) {
        setSelectedCity('Bengaluru');
      }
    }
  };

  const activeScopeSummary = useMemo(() => {
    if (coverageScope === 'all_india') {
      return {
        title: 'Entire India',
        subtitle: `${CITIES.length} metro & regional hubs`,
        Icon: Globe,
      };
    }
    if (coverageScope === 'karnataka') {
      const kaCount = CITIES.filter((c) => c.inKarnataka).length;
      return {
        title: 'Karnataka State',
        subtitle: `${kaCount} state network cities`,
        Icon: Compass,
      };
    }
    return {
      title: selectedCityMeta.name,
      subtitle: `${selectedCityMeta.state} · City focus`,
      Icon: MapPin,
    };
  }, [coverageScope, selectedCityMeta]);

  const scopeOptions: {
    id: CoverageScope;
    label: string;
    mobileLabel: string;
    shortLabel: string;
    Icon: typeof Globe;
  }[] = [
    {
      id: 'all_india',
      label: 'Entire India',
      mobileLabel: 'All India',
      shortLabel: 'All India',
      Icon: Globe,
    },
    {
      id: 'karnataka',
      label: 'Karnataka State',
      mobileLabel: 'Karnataka',
      shortLabel: 'Karnataka',
      Icon: Compass,
    },
    {
      id: 'city',
      label: 'Single City',
      mobileLabel: 'City',
      shortLabel: 'City',
      Icon: MapPin,
    },
  ];

  const availableCities = useMemo(() => {
    if (coverageScope === 'karnataka') {
      return CITIES.filter((c) => c.inKarnataka);
    }
    return CITIES;
  }, [coverageScope]);

  const showCityDropdown = alwaysShowCitySelect || coverageScope === 'city';
  const ActiveIcon = activeScopeSummary.Icon;

  if (variant === 'hero') {
    return (
      <div className="w-full max-w-full overflow-hidden bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 min-w-0">
          {/* Active Selected Area Summary */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-2xs">
              <ActiveIcon className="w-4.5 h-4.5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500">Selected Area</p>
              <div className="flex items-baseline gap-x-2 gap-y-0.5 flex-wrap min-w-0">
                <span className="font-display font-bold text-sm sm:text-base text-slate-900 truncate max-w-full">
                  {activeScopeSummary.title}
                </span>
                <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs text-slate-600 truncate max-w-full">
                  {activeScopeSummary.subtitle}
                </span>
              </div>
            </div>
          </div>

          {/* Segmented Scope Tabs + Styled City Dropdown */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 min-w-0 max-w-full">
            <div
              className="grid grid-cols-3 sm:inline-flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-2xs w-full sm:w-auto max-w-full min-w-0"
              role="group"
              aria-label="Portal Coverage Scope"
            >
              {scopeOptions.map(({id, label, mobileLabel, Icon}) => {
                const active = coverageScope === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleScopeSelect(id)}
                    className={`inline-flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap min-w-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
                      active
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-red-400' : 'text-slate-400'}`}
                      aria-hidden="true"
                    />
                    <span className="sm:hidden truncate">{mobileLabel}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </div>

            {showCityDropdown && (
              <div className="relative w-full sm:w-auto min-w-0 max-w-full">
                <MapPin
                  className="w-3.5 h-3.5 text-red-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setCoverageScope('city');
                  }}
                  aria-label="Select City"
                  className="appearance-none w-full sm:w-auto max-w-full h-10 pl-8 pr-9 bg-white border border-slate-300 hover:border-slate-400 rounded-xl text-xs font-semibold text-slate-900 shadow-2xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  {CITIES.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}, {city.state}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>
        </div>

        {/* Quick City Selector Strip when Single City is active */}
        {coverageScope === 'city' && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-200/80">
            <span className="text-xs font-medium text-slate-500 mr-1.5 whitespace-nowrap">
              Quick hubs
            </span>
            {QUICK_CITY_NAMES.map((cityName) => {
              const isSelected = selectedCity === cityName;
              return (
                <button
                  key={cityName}
                  type="button"
                  onClick={() => setSelectedCity(cityName)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-red-300 hover:text-red-700'
                  }`}
                >
                  {cityName}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full lg:w-auto max-w-full overflow-hidden flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
      <div
        className="grid grid-cols-3 sm:inline-flex items-center p-0.5 bg-white border border-slate-200/80 rounded-lg w-full sm:w-auto max-w-full min-w-0"
        role="group"
        aria-label="Coverage Scope"
      >
        {scopeOptions.map(({id, shortLabel, Icon}) => {
          const active = coverageScope === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => handleScopeSelect(id)}
              className={`inline-flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 whitespace-nowrap min-w-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
                active
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-red-400' : 'text-slate-400'}`}
                aria-hidden="true"
              />
              <span className="truncate">{shortLabel}</span>
            </button>
          );
        })}
      </div>

      {showCityDropdown && (
        <div className="relative w-full sm:w-auto min-w-0 max-w-full">
          <MapPin
            className="w-3.5 h-3.5 text-red-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            aria-label="Reference City"
            className="appearance-none w-full sm:w-auto max-w-full h-8 pl-8 pr-8 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            {availableCities.map((c) => (
              <option key={c.name} value={c.name}>
                {citySelectPrefix ? `${citySelectPrefix} ${c.name}` : c.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
