import React, {useMemo, useState} from 'react';
import {AlertCircle, CheckCircle2, Clock, ShieldCheck, X} from 'lucide-react';
import {usePortal} from '../context/PortalContext.tsx';
import {CITIES} from '../data/seedData.ts';
import {BloodBank, BloodGroup} from '../types/bloodconnect.ts';
import {
  BLOOD_GROUPS,
  formatExactTimestamp,
  formatTimeAgo,
  getStockFreshness,
} from '../utils/compatibility.ts';

type ComponentFilter = 'all' | 'wholeBlood' | 'prbc' | 'platelets' | 'ffp';

export function BloodAvailabilityPage() {
  const {
    bloodBanks,
    coverageScope,
    setCoverageScope,
    selectedCity,
    setSelectedCity,
    reserveBankUnits,
    currentUser,
  } = usePortal();

  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'ALL'>('ALL');
  const [componentFilter, setComponentFilter] = useState<ComponentFilter>('all');
  const [freshOnly, setFreshOnly] = useState(false);

  // Reserve Modal
  const [reserveTarget, setReserveTarget] = useState<{bank: BloodBank; group: BloodGroup} | null>(
    null
  );
  const [reserveUnits, setReserveUnits] = useState(1);
  const [patientName, setPatientName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState(currentUser?.phone ?? '');
  const [reserveResult, setReserveResult] = useState<{ok: boolean; message: string} | null>(null);

  const filteredBanks = useMemo(() => {
    return bloodBanks.filter((b) => {
      if (coverageScope === 'karnataka' && b.state !== 'Karnataka') return false;
      if (coverageScope === 'city' && b.city !== selectedCity) return false;
      if (freshOnly && getStockFreshness(b.lastVerifiedAt) === 'stale') return false;
      return true;
    });
  }, [bloodBanks, coverageScope, selectedCity, freshOnly]);

  const getUnitsForDisplay = (bank: BloodBank, group: BloodGroup) => {
    const stock = bank.stock[group];
    if (componentFilter === 'all') return stock.confirmedUnits;
    return stock.components[componentFilter];
  };

  // Summary totals across all 8 blood groups (strictly confirmed vs unverified hold separated)
  const groupTotals = useMemo(() => {
    return BLOOD_GROUPS.map((group) => {
      const confirmed = filteredBanks.reduce(
        (sum, bank) => sum + getUnitsForDisplay(bank, group),
        0
      );
      const hold = filteredBanks.reduce(
        (sum, bank) => sum + bank.stock[group].unverifiedHoldUnits,
        0
      );
      return {group, confirmed, hold};
    });
  }, [filteredBanks, componentFilter]);

  const handleOpenReserve = (bank: BloodBank, group: BloodGroup) => {
    setReserveTarget({bank, group});
    setReserveUnits(1);
    setReserveResult(null);
  };

  const handleConfirmReserve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveTarget) return;
    const res = reserveBankUnits({
      bankId: reserveTarget.bank.id,
      bloodGroup: reserveTarget.group,
      units: reserveUnits,
      patientName,
      requesterPhone,
    });
    if (res.ok) {
      setReserveResult({
        ok: true,
        message: `Reserved ${reserveUnits} verified unit(s) of ${reserveTarget.group} at ${reserveTarget.bank.name}. Present patient requisition slip within 2 hours.`,
      });
    } else {
      setReserveResult({ok: false, message: res.error ?? 'Reservation failed.'});
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-2">
          <p className="text-xs font-medium text-red-700">Timestamped Component Ledger</p>
          <h1 className="font-display font-bold text-3xl text-slate-900">Blood Availability</h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Confirmed cross-matched blood units across licensed blood banks. Unverified intake
            donations still undergoing TTI screening are tracked separately and never counted as
            confirmed available blood.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
            {(
              [
                {id: 'all_india', label: 'All India'},
                {id: 'karnataka', label: 'Karnataka'},
                {id: 'city', label: 'City'},
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCoverageScope(s.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  coverageScope === s.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {coverageScope === 'city' && (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
            >
              {CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 8-Group Confirmed Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {groupTotals.map(({group, confirmed, hold}) => {
          const isSelected = selectedGroup === group;
          const isLow = confirmed <= 5;
          return (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedGroup(isSelected ? 'ALL' : group)}
              className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-red-600 text-white border-red-700'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-base">{group}</span>
                {isLow && !isSelected && (
                  <span className="text-[11px] font-medium text-red-700">Low</span>
                )}
              </div>
              <p className="mt-2 font-mono font-bold text-2xl tabular-nums">{confirmed}</p>
              <p
                className={`text-[11px] mt-1 tabular-nums ${
                  isSelected ? 'text-red-100' : 'text-slate-500'
                }`}
              >
                {hold} unverified hold
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1">Component:</span>
          {(
            [
              {id: 'all', label: 'All Components'},
              {id: 'wholeBlood', label: 'Whole Blood'},
              {id: 'prbc', label: 'PRBC'},
              {id: 'platelets', label: 'Platelets'},
              {id: 'ffp', label: 'FFP'},
            ] as {id: ComponentFilter; label: string}[]
          ).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setComponentFilter(c.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                componentFilter === c.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={freshOnly}
            onChange={(e) => setFreshOnly(e.target.checked)}
            className="rounded border-slate-300 text-red-600 focus:ring-red-600"
          />
          <span>Hide stale inventories (&gt;12h since verification)</span>
        </label>
      </div>

      {/* Bank-by-Bank Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4">Blood Bank &amp; Verification Timestamp</th>
                {(selectedGroup === 'ALL' ? BLOOD_GROUPS : [selectedGroup]).map((g) => (
                  <th key={g} className="py-3.5 px-3 text-right font-display">
                    {g}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredBanks.map((bank) => {
                const freshness = getStockFreshness(bank.lastVerifiedAt);
                return (
                  <tr key={bank.id} className="hover:bg-slate-50/70">
                    <td className="py-4 px-4 align-top min-w-[260px]">
                      <p className="font-semibold text-slate-900">{bank.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {bank.city}, {bank.state} · {bank.licenseNumber}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                        {freshness === 'fresh' ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                        ) : freshness === 'aging' ? (
                          <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
                        )}
                        <span
                          className={
                            freshness === 'stale'
                              ? 'text-red-700 font-medium'
                              : freshness === 'aging'
                              ? 'text-amber-800 font-medium'
                              : 'text-emerald-800 font-medium'
                          }
                        >
                          {freshness === 'stale'
                            ? 'Verification Stale'
                            : freshness === 'aging'
                            ? 'Verified Today'
                            : 'Recently Verified'}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono text-slate-500 tabular-nums">
                          {formatTimeAgo(bank.lastVerifiedAt)} (
                          {formatExactTimestamp(bank.lastVerifiedAt)})
                        </span>
                      </div>
                    </td>

                    {(selectedGroup === 'ALL' ? BLOOD_GROUPS : [selectedGroup]).map((g) => {
                      const units = getUnitsForDisplay(bank, g);
                      const hold = bank.stock[g].unverifiedHoldUnits;
                      return (
                        <td key={g} className="py-4 px-3 text-right align-top">
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              disabled={units === 0}
                              onClick={() => handleOpenReserve(bank, g)}
                              title={
                                units > 0
                                  ? `Reserve ${g} from ${bank.name}`
                                  : `No confirmed ${g} units available`
                              }
                              className={`font-mono font-bold text-sm tabular-nums px-2 py-1 rounded-md transition-colors ${
                                units === 0
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : units <= 2
                                  ? 'text-red-700 bg-red-50 hover:bg-red-100 cursor-pointer'
                                  : 'text-slate-900 bg-slate-100 hover:bg-slate-200 cursor-pointer'
                              }`}
                            >
                              {units}
                            </button>
                            {hold > 0 && (
                              <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                                +{hold} hold
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reserve Units Modal */}
      {reserveTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-5 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Reserve {reserveTarget.group} Blood Units
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {reserveTarget.bank.name} ·{' '}
                  <span className="font-mono tabular-nums">
                    {reserveTarget.bank.stock[reserveTarget.group].confirmedUnits} confirmed units
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReserveTarget(null)}
                aria-label="Close reservation dialog"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reserveResult?.ok ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{reserveResult.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReserveTarget(null)}
                  className="w-full py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmReserve} className="space-y-4">
                {reserveResult && !reserveResult.ok && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                    {reserveResult.message}
                  </p>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Patient full name"
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Units to Hold
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={reserveTarget.bank.stock[reserveTarget.group].confirmedUnits}
                      required
                      value={reserveUnits}
                      onChange={(e) => setReserveUnits(Number(e.target.value))}
                      className="w-full h-10 px-3 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Attendant Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={requesterPhone}
                      onChange={(e) => setRequesterPhone(e.target.value)}
                      placeholder="+91 98455 10293"
                      className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReserveTarget(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Confirm Unit Hold
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
