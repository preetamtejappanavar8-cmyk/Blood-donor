import React, {useMemo, useState} from 'react';
import {AlertTriangle, CheckCircle2, Clock, Search, ShieldCheck, Siren} from 'lucide-react';
import {usePortal} from '../context/PortalContext.tsx';
import {CITIES} from '../data/seedData.ts';
import {
  BloodComponent,
  BloodGroup,
  EmergencyRequest,
  RequestStatus,
  RequestUrgency,
} from '../types/bloodconnect.ts';
import {BLOOD_GROUPS, formatExactTimestamp, formatTimeAgo} from '../utils/compatibility.ts';

const STATUS_STEPS: {id: RequestStatus; label: string}[] = [
  {id: 'submitted', label: 'Submitted'},
  {id: 'verified', label: 'Coordinator Verified'},
  {id: 'donors_notified', label: 'Donors & Banks Alerted'},
  {id: 'fulfilled', label: 'Fulfilled'},
];

const COMPONENTS: BloodComponent[] = [
  'Whole Blood',
  'Packed Red Cells (PRBC)',
  'Platelets (RDP/SDP)',
  'Fresh Frozen Plasma (FFP)',
];

export function EmergencyRequestPage() {
  const {requests, submitEmergencyRequest, navigate} = usePortal();

  const [patientName, setPatientName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [locality, setLocality] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [component, setComponent] = useState<BloodComponent>('Packed Red Cells (PRBC)');
  const [unitsNeeded, setUnitsNeeded] = useState(2);
  const [urgency, setUrgency] = useState<RequestUrgency>('critical');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [duplicateWarning, setDuplicateWarning] = useState<EmergencyRequest | null>(null);
  const [createdRequest, setCreatedRequest] = useState<EmergencyRequest | null>(null);
  const [trackQuery, setTrackQuery] = useState('');

  const submitForm = (allowDuplicateOverride = false) => {
    const result = submitEmergencyRequest({
      patientName,
      hospitalName,
      city,
      locality,
      bloodGroup,
      component,
      unitsNeeded,
      urgency,
      contactName,
      contactPhone,
      notes,
      allowDuplicateOverride,
    });

    if (result.duplicateWarning) {
      setDuplicateWarning(result.duplicateWarning);
      return;
    }

    if (result.request) {
      setDuplicateWarning(null);
      setCreatedRequest(result.request);
      setTrackQuery(result.request.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm(false);
  };

  const trackedRequests = useMemo(() => {
    const q = trackQuery.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.patientName.toLowerCase().includes(q) ||
        r.hospitalName.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.bloodGroup.toLowerCase() === q
    );
  }, [requests, trackQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <p className="text-xs font-medium text-red-700">24×7 Emergency Dispatch</p>
        <h1 className="font-display font-bold text-3xl text-slate-900">
          Emergency Blood Request &amp; Live Tracker
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Submit an urgent hospital blood requirement or track an existing request ID from initial
          submission through coordinator verification and donor dispatch.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Request Form */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
          {createdRequest ? (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  <span>Emergency Request Submitted</span>
                </div>
                <p className="text-xs text-emerald-800">
                  Tracking ID:{' '}
                  <span className="font-mono font-bold text-emerald-950">{createdRequest.id}</span>
                </p>
                <p className="text-xs text-emerald-800">
                  Your request is now in the coordinator verification queue. You can also search
                  verified donors directly while dispatch is underway.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('find-donors')}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Search Verified Donors Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedRequest(null);
                    setPatientName('');
                    setNotes('');
                  }}
                  className="px-4 py-2.5 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-2 text-slate-900">
                <Siren className="w-5 h-5 text-red-600" aria-hidden="true" />
                <h2 className="font-display font-bold text-xl">New Emergency Request</h2>
              </div>

              {duplicateWarning && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle
                      className="w-5 h-5 text-amber-700 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-amber-950">
                        Potential Duplicate Active Request Detected ({duplicateWarning.id})
                      </p>
                      <p className="text-amber-900">
                        An active request for <strong>{duplicateWarning.bloodGroup}</strong> at{' '}
                        <strong>{duplicateWarning.hospitalName}</strong> already exists (submitted{' '}
                        {formatTimeAgo(duplicateWarning.createdAt)}).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTrackQuery(duplicateWarning.id)}
                      className="px-3 py-1.5 bg-amber-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      View Existing Request
                    </button>
                    <button
                      type="button"
                      onClick={() => submitForm(true)}
                      className="px-3 py-1.5 bg-white border border-amber-400 text-amber-950 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Submit Separate Request Anyway
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="e.g. Victoria Hospital"
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    {CITIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}, {c.state}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hospital Locality / Ward
                  </label>
                  <input
                    type="text"
                    required
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Trauma ICU, Ward 3"
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Required Blood Group
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {BLOOD_GROUPS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setBloodGroup(g)}
                      className={`h-10 rounded-lg font-display font-bold text-sm border transition-colors cursor-pointer ${
                        bloodGroup === g
                          ? 'bg-red-600 text-white border-red-700'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-red-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Component</label>
                  <select
                    value={component}
                    onChange={(e) => setComponent(e.target.value as BloodComponent)}
                    className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    {COMPONENTS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Units Needed
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={unitsNeeded}
                    onChange={(e) => setUnitsNeeded(Number(e.target.value))}
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Urgency</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as RequestUrgency)}
                    className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="critical">Critical (Within 2 hrs)</option>
                    <option value="urgent">Urgent (Today)</option>
                    <option value="scheduled">Scheduled Surgery</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Attendant / Coordinator Name
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Contact person"
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Attendant Mobile Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98455 10293"
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Clinical / Cross-Match Note
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ward number, requisition slip status, or platelet apheresis note..."
                  className="w-full p-3 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Dispatch Emergency Request
              </button>
            </form>
          )}
        </div>

        {/* Live Request Status Tracker */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display font-bold text-lg text-slate-900">
                Track Emergency Request Status
              </h2>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {trackedRequests.length} requests
              </span>
            </div>

            <div className="relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Search by Request ID (e.g. REQ-2026-841), hospital, or city..."
                className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              />
            </div>
          </div>

          <div className="space-y-4">
            {trackedRequests.map((req) => {
              const stepIdx = STATUS_STEPS.findIndex((s) => s.id === req.status);
              const isFlagged = req.status === 'flagged_duplicate';

              return (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-slate-900">{req.id}</span>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-semibold text-red-700 uppercase tracking-wide">
                          {req.urgency}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-500 font-mono tabular-nums">
                          {formatTimeAgo(req.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base text-slate-900">
                        {req.hospitalName} ({req.city})
                      </h3>
                      <p className="text-xs text-slate-600">
                        Patient: {req.patientName} · {req.component} ·{' '}
                        <span className="font-mono tabular-nums">{req.unitsNeeded} units</span>
                      </p>
                    </div>

                    <span className="font-display font-extrabold text-lg text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1 shrink-0">
                      {req.bloodGroup}
                    </span>
                  </div>

                  {isFlagged ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                      <span>Flagged as duplicate or invalid request by coordinator review.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                      {STATUS_STEPS.map((step, idx) => {
                        const completed = idx <= stepIdx;
                        return (
                          <div key={step.id} className="space-y-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                completed ? 'bg-red-600' : 'bg-slate-200'
                              }`}
                            />
                            <p
                              className={`text-[11px] leading-tight ${
                                completed ? 'font-semibold text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                    <span className="inline-flex items-center gap-1.5">
                      {req.verifiedBy ? (
                        <>
                          <ShieldCheck
                            className="w-3.5 h-3.5 text-emerald-700"
                            aria-hidden="true"
                          />
                          <span>Verified by {req.verifiedBy}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                          <span>Awaiting desk verification</span>
                        </>
                      )}
                    </span>
                    <span className="font-mono tabular-nums">
                      Updated {formatExactTimestamp(req.updatedAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
