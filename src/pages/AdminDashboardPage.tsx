import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Users,
  XCircle,
} from 'lucide-react';
import {usePortal} from '../context/PortalContext.tsx';
import {BloodGroup, RequestStatus} from '../types/bloodconnect.ts';
import {
  BLOOD_GROUPS,
  formatExactTimestamp,
  formatTimeAgo,
  getStockFreshness,
} from '../utils/compatibility.ts';

type AdminTab = 'donors' | 'requests' | 'stock' | 'alerts' | 'audit';

export function AdminDashboardPage() {
  const {
    donors,
    bloodBanks,
    requests,
    contactLogs,
    reservationLogs,
    currentUser,
    quickDemoSignIn,
    verifyDonor,
    rejectDonor,
    updateRequestStatus,
    verifyAndTimestampBankStock,
    resetDemoData,
    emailNotifications,
    emailConfigured,
    notificationRecipient,
  } = usePortal();

  const [activeTab, setActiveTab] = useState<AdminTab>('donors');
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [stockDraft, setStockDraft] = useState<
    Record<BloodGroup, {confirmedUnits: number; unverifiedHoldUnits: number}>
  >({} as Record<BloodGroup, {confirmedUnits: number; unverifiedHoldUnits: number}>);

  const pendingDonors = useMemo(
    () => donors.filter((d) => d.verificationStatus === 'pending_review'),
    [donors]
  );
  const verifiedDonors = useMemo(
    () => donors.filter((d) => d.verificationStatus === 'verified'),
    [donors]
  );
  const staleBanks = useMemo(
    () => bloodBanks.filter((b) => getStockFreshness(b.lastVerifiedAt) === 'stale'),
    [bloodBanks]
  );

  // Check duplicate phone/hospital patterns across open requests
  const suspiciousRequestIds = useMemo(() => {
    const flagged = new Set<string>();
    for (let i = 0; i < requests.length; i++) {
      for (let j = i + 1; j < requests.length; j++) {
        const a = requests[i];
        const b = requests[j];
        if (
          a.status !== 'flagged_duplicate' &&
          b.status !== 'flagged_duplicate' &&
          a.bloodGroup === b.bloodGroup &&
          a.city === b.city &&
          (a.contactPhone.replace(/\D/g, '').slice(-10) ===
            b.contactPhone.replace(/\D/g, '').slice(-10) ||
            a.hospitalName.toLowerCase() === b.hospitalName.toLowerCase())
        ) {
          flagged.add(a.id);
          flagged.add(b.id);
        }
      }
    }
    return flagged;
  }, [requests]);

  const startEditingBank = (bankId: string) => {
    const bank = bloodBanks.find((b) => b.id === bankId);
    if (!bank) return;
    const draft = {} as Record<BloodGroup, {confirmedUnits: number; unverifiedHoldUnits: number}>;
    BLOOD_GROUPS.forEach((g) => {
      draft[g] = {
        confirmedUnits: bank.stock[g].confirmedUnits,
        unverifiedHoldUnits: bank.stock[g].unverifiedHoldUnits,
      };
    });
    setStockDraft(draft);
    setEditingBankId(bankId);
  };

  const saveBankVerification = (bankId: string) => {
    verifyAndTimestampBankStock(bankId, stockDraft);
    setEditingBankId(null);
  };

  // Coordinator Role Gate
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-5">
          <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" aria-hidden="true" />
          <div className="space-y-2">
            <h1 className="font-display font-bold text-2xl text-slate-900">
              Coordinator Admin Authorization Required
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Verifying donor screenings, stamping blood bank stock, and screening duplicate
              emergency requests requires an authorized BloodConnect coordinator account.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => quickDemoSignIn('admin')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Sign in as Demo Coordinator (Dr. Meera Nair)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-2">
          <p className="text-xs font-medium text-red-700">
            Coordinator Console · Signed in as {currentUser.name}
          </p>
          <h1 className="font-display font-bold text-3xl text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Verify pending donor registrations, validate emergency requests against duplicates, and
            maintain timestamped blood bank stock integrity.
          </p>
        </div>

        <button
          type="button"
          onClick={resetDemoData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Top Integrity KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Pending Donor Queue</span>
            <Clock className="w-4 h-4 text-amber-600" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display font-bold text-2xl text-slate-900 tabular-nums">
            {pendingDonors.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Excluded from confirmed search</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Verified Donors</span>
            <Users className="w-4 h-4 text-emerald-700" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display font-bold text-2xl text-slate-900 tabular-nums">
            {verifiedDonors.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Active in public directory</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Open Emergency Requests</span>
            <Siren className="w-4 h-4 text-red-600" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display font-bold text-2xl text-slate-900 tabular-nums">
            {
              requests.filter(
                (r) => r.status !== 'fulfilled' && r.status !== 'flagged_duplicate'
              ).length
            }
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {suspiciousRequestIds.size} flagged for duplicate check
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Stale Stock Warnings</span>
            <Building2 className="w-4 h-4 text-slate-500" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display font-bold text-2xl text-slate-900 tabular-nums">
            {staleBanks.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Banks &gt; 12h since verification</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
        {(
          [
            {id: 'donors', label: `Donor Verification (${pendingDonors.length} pending)`},
            {id: 'requests', label: `Emergency Requests (${requests.length})`},
            {id: 'stock', label: `Stock Verification (${bloodBanks.length})`},
            {id: 'alerts', label: `Email Alerts (${emailNotifications.length})`},
            {id: 'audit', label: `Contact & Hold Logs (${contactLogs.length + reservationLogs.length})`},
          ] as {id: AdminTab; label: string}[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Donor Verification */}
      {activeTab === 'donors' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-slate-900">
                Unverified Donor Registrations Queue
              </h2>
              <span className="text-xs text-slate-500">
                Approve after phone &amp; screening validation
              </span>
            </div>

            {pendingDonors.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-600">
                All donor registrations have been reviewed.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {pendingDonors.map((d) => (
                  <div
                    key={d.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-display font-bold text-sm text-slate-900">
                          {d.name}
                        </span>
                        <span className="font-mono font-bold text-red-700">{d.bloodGroup}</span>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-amber-800 font-medium">Unverified</span>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono text-slate-500 tabular-nums">
                          Registered {formatTimeAgo(d.registeredAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {d.locality}, {d.city}, {d.state} · {d.phone} · Age {d.age}, {d.weightKg} kg
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => verifyDonor(d.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Verify Donor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectDonor(d.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-display font-bold text-base text-slate-900">
                Verified Donors Registry ({verifiedDonors.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-3 px-4 font-semibold">Donor</th>
                    <th className="py-3 px-4 font-semibold">Group</th>
                    <th className="py-3 px-4 font-semibold">Location</th>
                    <th className="py-3 px-4 font-semibold">Availability</th>
                    <th className="py-3 px-4 font-semibold">Verified By</th>
                    <th className="py-3 px-4 font-semibold text-right">Verified At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {verifiedDonors.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{d.name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-red-700">{d.bloodGroup}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {d.locality}, {d.city}
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-700">
                        {d.availability.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{d.verifiedBy ?? 'Coordinator'}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                        {formatExactTimestamp(d.verifiedAt ?? d.registeredAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Emergency Requests & Duplicate Prevention */}
      {activeTab === 'requests' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-display font-bold text-base text-slate-900">
              Emergency Request Moderation &amp; Duplicate Prevention
            </h2>
          </div>
          <div className="divide-y divide-slate-200">
            {requests.map((req) => {
              const isSuspicious =
                Boolean(req.duplicateOfId) || suspiciousRequestIds.has(req.id);

              return (
                <div key={req.id} className="p-5 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-slate-900">{req.id}</span>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-bold text-red-700">
                          {req.bloodGroup} ({req.unitsNeeded} units)
                        </span>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="capitalize font-medium text-slate-700">{req.urgency}</span>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono text-slate-500 tabular-nums">
                          {formatExactTimestamp(req.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {req.patientName} — {req.hospitalName} ({req.city})
                      </p>
                      <p className="text-xs text-slate-600">
                        Contact: {req.contactName} ({req.contactPhone}) · {req.component}
                      </p>
                      {isSuspicious && req.status !== 'flagged_duplicate' && (
                        <p className="text-xs text-amber-800 inline-flex items-center gap-1.5 pt-1">
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            Potential duplicate match detected (same hospital/phone &amp; blood
                            group). Review before dispatching.
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {(
                        [
                          {id: 'verified', label: 'Verify'},
                          {id: 'donors_notified', label: 'Notify Donors'},
                          {id: 'fulfilled', label: 'Mark Fulfilled'},
                          {id: 'flagged_duplicate', label: 'Flag Duplicate/Fake'},
                        ] as {id: RequestStatus; label: string}[]
                      ).map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => updateRequestStatus(req.id, action.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                            req.status === action.id
                              ? action.id === 'flagged_duplicate'
                                ? 'bg-amber-900 text-white border-amber-900'
                                : 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Blood Bank Stock Verification */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {bloodBanks.map((bank) => {
            const isEditing = editingBankId === bank.id;
            const freshness = getStockFreshness(bank.lastVerifiedAt);

            return (
              <div
                key={bank.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900">{bank.name}</h3>
                    <p className="text-xs text-slate-500">
                      {bank.city}, {bank.state} · {bank.licenseNumber} · Verified by{' '}
                      {bank.verifiedBy}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-mono tabular-nums ${
                        freshness === 'stale' ? 'text-red-700 font-semibold' : 'text-emerald-800'
                      }`}
                    >
                      {formatTimeAgo(bank.lastVerifiedAt)} ({formatExactTimestamp(bank.lastVerifiedAt)})
                    </span>

                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => saveBankVerification(bank.id)}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Save &amp; Stamp Timestamp
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditingBank(bank.id)}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Adjust Counts
                        </button>
                        <button
                          type="button"
                          onClick={() => verifyAndTimestampBankStock(bank.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Re-verify Timestamp Now</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {BLOOD_GROUPS.map((g) => {
                    const curr = isEditing ? stockDraft[g] : bank.stock[g];
                    return (
                      <div
                        key={g}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1"
                      >
                        <p className="text-xs font-display font-bold text-slate-900">{g}</p>
                        {isEditing ? (
                          <div className="space-y-1">
                            <label className="block text-[10px] text-slate-500">
                              Confirmed
                              <input
                                type="number"
                                min={0}
                                value={curr.confirmedUnits}
                                onChange={(e) =>
                                  setStockDraft((prev) => ({
                                    ...prev,
                                    [g]: {...prev[g], confirmedUnits: Number(e.target.value)},
                                  }))
                                }
                                className="w-full mt-0.5 px-1.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
                              />
                            </label>
                            <label className="block text-[10px] text-slate-500">
                              Unverified Hold
                              <input
                                type="number"
                                min={0}
                                value={curr.unverifiedHoldUnits}
                                onChange={(e) =>
                                  setStockDraft((prev) => ({
                                    ...prev,
                                    [g]: {...prev[g], unverifiedHoldUnits: Number(e.target.value)},
                                  }))
                                }
                                className="w-full mt-0.5 px-1.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
                              />
                            </label>
                          </div>
                        ) : (
                          <>
                            <p className="font-mono font-bold text-base text-slate-900 tabular-nums">
                              {curr.confirmedUnits}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500 tabular-nums">
                              +{curr.unverifiedHoldUnits} hold
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Audit & Activity Logs */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="font-display font-bold text-base text-slate-900">
              Donor Contact Disclosure Log ({contactLogs.length})
            </h2>
            {contactLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                No donor contact disclosures logged in this session yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {contactLogs.map((log) => (
                  <div key={log.id} className="py-3 space-y-1">
                    <p className="font-semibold text-slate-900">
                      {log.requesterName} contacted {log.donorName} ({log.bloodGroup})
                    </p>
                    <p className="text-slate-600">
                      {log.hospitalName} · {log.requesterPhone} ·{' '}
                      <span className="font-mono tabular-nums">
                        {formatExactTimestamp(log.timestamp)}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="font-display font-bold text-base text-slate-900">
              Blood Bank Unit Reservations ({reservationLogs.length})
            </h2>
            {reservationLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                No blood bank unit reservations logged in this session yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {reservationLogs.map((res) => (
                  <div key={res.id} className="py-3 space-y-1">
                    <p className="font-semibold text-slate-900">
                      {res.units} unit(s) of {res.bloodGroup} held at {res.bankName}
                    </p>
                    <p className="text-slate-600">
                      Patient: {res.patientName} · {res.requesterPhone} ·{' '}
                      <span className="font-mono tabular-nums">
                        {formatExactTimestamp(res.timestamp)}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Email Alerts Outbox */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900">
                <Mail className="w-4 h-4 text-red-600" aria-hidden="true" />
                <h2 className="font-display font-bold text-base">
                  Owner Email Alerts ({notificationRecipient})
                </h2>
              </div>
              <p className="text-xs text-slate-600">
                Automatically triggered on new account/donor registrations, blood donations,
                emergency blood requests, donor contact unlocks, and unit reservations.
              </p>
            </div>
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 ${
                emailConfigured
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              {emailConfigured
                ? 'Live SMTP / Resend Delivery Active'
                : 'Awaiting SMTP / Resend Secret'}
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {emailNotifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-600">
                No email notifications triggered in this session yet. Register a donor, update
                availability, or submit/reserve blood to test an alert.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {emailNotifications.map((item) => {
                  const mailtoHref = `mailto:${encodeURIComponent(
                    item.recipient
                  )}?subject=${encodeURIComponent(item.subject)}&body=${encodeURIComponent(
                    `Actor: ${item.actorName}\nBlood Group: ${item.bloodGroup}\nLocation: ${item.city}\nPhone: ${item.actorPhone}\nEmail: ${item.actorEmail}\nDetails: ${item.details}\nTime: ${item.timestamp}`
                  )}`;

                  return (
                    <div
                      key={item.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-900">{item.subject}</span>
                          <span className="text-slate-300" aria-hidden="true">
                            ·
                          </span>
                          <span
                            className={
                              item.status === 'sent'
                                ? 'text-emerald-700 font-semibold'
                                : item.status === 'failed'
                                ? 'text-red-700 font-semibold'
                                : 'text-amber-800 font-medium'
                            }
                          >
                            {item.status === 'sent'
                              ? `Sent via ${item.provider.toUpperCase()}`
                              : item.status === 'failed'
                              ? 'Delivery Failed'
                              : 'Logged (Needs SMTP/Resend Secret)'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {item.actorName}
                          {item.actorPhone ? ` · ${item.actorPhone}` : ''} · {item.city} ·{' '}
                          <span className="font-mono tabular-nums">
                            {formatExactTimestamp(item.timestamp)}
                          </span>
                        </p>
                        {item.details && <p className="text-xs text-slate-500">{item.details}</p>}
                      </div>

                      <a
                        href={mailtoHref}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Open in Mail</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
