import React, {useMemo, useState} from 'react';
import {
  CheckCircle2,
  Clock,
  HeartHandshake,
  ShieldAlert,
  ShieldCheck,
  Siren,
} from 'lucide-react';
import {usePortal} from '../context/PortalContext.tsx';
import {CITIES} from '../data/seedData.ts';
import {BloodGroup, DonorAvailability} from '../types/bloodconnect.ts';
import {
  BLOOD_GROUPS,
  formatExactTimestamp,
  formatTimeAgo,
  getCompatibleDonorGroups,
} from '../utils/compatibility.ts';

export function BecomeDonorPage() {
  const {
    donors,
    requests,
    currentUser,
    registerDonor,
    updateDonorAvailability,
    respondToEmergencyOffer,
    quickDemoSignIn,
    navigate,
  } = usePortal();

  const myDonorProfile = useMemo(() => {
    if (!currentUser) return undefined;
    if (currentUser.donorId) {
      return donors.find((d) => d.id === currentUser.donorId);
    }
    return donors.find((d) => d.email.toLowerCase() === currentUser.email.toLowerCase());
  }, [currentUser, donors]);

  // Registration Form State
  const [name, setName] = useState(currentUser?.name ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [city, setCity] = useState('Bengaluru');
  const [locality, setLocality] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [availability, setAvailability] = useState<DonorAvailability>('available');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [age, setAge] = useState(26);
  const [weightKg, setWeightKg] = useState(64);
  const [eligibleConfirmed, setEligibleConfirmed] = useState(false);
  const [submittedDonorId, setSubmittedDonorId] = useState<string | null>(null);

  const matchingEmergencyRequests = useMemo(() => {
    if (!myDonorProfile) return [];
    return requests.filter((req) => {
      if (req.status === 'fulfilled' || req.status === 'flagged_duplicate') return false;
      const compatible = getCompatibleDonorGroups(req.bloodGroup).includes(
        myDonorProfile.bloodGroup
      );
      return compatible && (req.city === myDonorProfile.city || req.state === myDonorProfile.state);
    });
  }, [requests, myDonorProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibleConfirmed) return;
    const created = registerDonor({
      name,
      phone,
      email,
      bloodGroup,
      city,
      locality,
      availability,
      lastDonationDate,
      age,
      weightKg,
    });
    setSubmittedDonorId(created.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-2">
          <p className="text-xs font-medium text-red-700">Voluntary Donor Portal</p>
          <h1 className="font-display font-bold text-3xl text-slate-900">Become a Blood Donor</h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Register your blood group and location, manage your real-time availability status, and
            respond to verified emergency requests near you.
          </p>
        </div>
        {!currentUser && (
          <button
            type="button"
            onClick={() => quickDemoSignIn('donor')}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap cursor-pointer"
          >
            Sign in as Demo Verified Donor (Karthik R.)
          </button>
        )}
      </div>

      {/* Existing Donor Dashboard (Availability & Emergency Offers) */}
      {myDonorProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Registered Donor Profile</p>
                <h2 className="font-display font-bold text-xl text-slate-900 mt-0.5">
                  {myDonorProfile.name}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  {myDonorProfile.locality}, {myDonorProfile.city} · {myDonorProfile.phone}
                </p>
              </div>
              <span className="font-display font-extrabold text-xl text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                {myDonorProfile.bloodGroup}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-2">
                {myDonorProfile.verificationStatus === 'verified' ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span className="font-semibold text-emerald-800">
                      Verified Donor ({myDonorProfile.verifiedBy})
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                    <span className="font-semibold text-amber-800">
                      Pending Coordinator Verification
                    </span>
                  </>
                )}
              </div>
              <p className="text-slate-600 font-mono tabular-nums">
                Availability updated {formatTimeAgo(myDonorProfile.lastAvailabilityUpdatedAt)} (
                {formatExactTimestamp(myDonorProfile.lastAvailabilityUpdatedAt)})
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-900">Update Availability Status</p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    {id: 'available', label: 'Available'},
                    {id: 'unavailable', label: 'Unavailable'},
                    {id: 'recently_donated', label: 'Donated Recently'},
                  ] as {id: DonorAvailability; label: string}[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateDonorAvailability(myDonorProfile.id, opt.id)}
                    className={`py-2 px-2.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      myDonorProfile.availability === opt.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Incoming Emergency Donation Requests */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Siren className="w-4 h-4 text-red-600" aria-hidden="true" />
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Matching Emergency Donation Requests
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {matchingEmergencyRequests.length} active
              </span>
            </div>

            {matchingEmergencyRequests.length === 0 ? (
              <p className="text-sm text-slate-600 py-6 text-center border border-dashed border-slate-200 rounded-lg">
                No active compatible emergency requests in {myDonorProfile.state} right now.
              </p>
            ) : (
              <div className="space-y-3">
                {matchingEmergencyRequests.map((req) => {
                  const hasAccepted = req.matchedDonorIds.includes(myDonorProfile.id);
                  const hasDeclined = req.declinedDonorIds.includes(myDonorProfile.id);

                  return (
                    <div
                      key={req.id}
                      className="p-4 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-semibold text-slate-900">{req.id}</span>
                          <span className="text-slate-300" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-semibold text-red-700">
                            {req.bloodGroup} ({req.unitsNeeded} units)
                          </span>
                          <span className="text-slate-300" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-slate-600 capitalize">{req.urgency}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {req.hospitalName} ({req.locality}, {req.city})
                        </p>
                        <p className="text-xs text-slate-600">{req.notes}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {hasAccepted ? (
                          <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                            Response Sent
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => respondToEmergencyOffer(req.id, myDonorProfile.id, true)}
                              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                            >
                              Accept Request
                            </button>
                            {!hasDeclined && (
                              <button
                                type="button"
                                onClick={() =>
                                  respondToEmergencyOffer(req.id, myDonorProfile.id, false)
                                }
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer"
                              >
                                Decline
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Donor Registration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          {submittedDonorId ? (
            <div className="space-y-5">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <h2 className="font-display font-bold text-base text-amber-950">
                    Registration Submitted — Pending Coordinator Verification
                  </h2>
                  <p className="text-sm text-amber-900">
                    Your donor profile (<span className="font-mono">{submittedDonorId}</span>) has
                    been saved. To uphold clinical safety, unverified registrations are not listed
                    as confirmed available blood until approved in the Admin Dashboard.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('admin')}
                  className="px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Open Admin Verification Queue
                </button>
                <button
                  type="button"
                  onClick={() => setSubmittedDonorId(null)}
                  className="px-4 py-2.5 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Register Another Donor
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-display font-bold text-xl text-slate-900">
                  New Voluntary Donor Registration
                </h2>
                <p className="text-xs text-slate-600">
                  All submissions undergo coordinator verification before appearing in public
                  confirmed donor results.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aditya Rao"
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98450 00000"
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="donor@example.in"
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
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
                    Locality / Area
                  </label>
                  <input
                    type="text"
                    required
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. HSR Layout Sector 2"
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Last Donation Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={lastDonationDate}
                    onChange={(e) => setLastDonationDate(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">Blood Group</label>
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Age (18–65)
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={65}
                    required
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Weight (kg, ≥ 50)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={160}
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Initial Availability
                  </label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as DonorAvailability)}
                    className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="available">Available Now</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="recently_donated">Recently Donated</option>
                  </select>
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={eligibleConfirmed}
                  onChange={(e) => setEligibleConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-600"
                />
                <span>
                  I confirm I meet standard Indian NBTC voluntary blood donation criteria (18–65
                  years, ≥ 50 kg, no recent fever or infection, ≥ 90 days since last whole blood
                  donation).
                </span>
              </label>

              <button
                type="submit"
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Submit Donor Registration
              </button>
            </form>
          )}
        </div>

        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-display font-bold text-base">
            <HeartHandshake className="w-5 h-5 text-red-600" aria-hidden="true" />
            <span>Verification &amp; Eligibility</span>
          </div>
          <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <li className="pb-3 border-b border-slate-100">
              <span className="font-semibold text-slate-900 block">Why verification matters</span>
              Coordinators validate phone reachability and screening eligibility before exposing a
              donor to hospital emergency searches.
            </li>
            <li className="pb-3 border-b border-slate-100">
              <span className="font-semibold text-slate-900 block">Donation interval</span>
              Whole blood donors wait 90 days between donations; plateletpheresis donors may donate
              after 48 hours up to 24 times/year.
            </li>
            <li>
              <span className="font-semibold text-slate-900 block">Privacy protection</span>
              Your phone number is never displayed publicly — requesters must submit patient and
              hospital details before contacting you.
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
