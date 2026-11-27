import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import {CoverageSelector} from '../components/CoverageSelector.tsx';
import {SpatialProximityMap} from '../components/SpatialProximityMap.tsx';
import {usePortal} from '../context/PortalContext.tsx';
import {CITIES} from '../data/seedData.ts';
import {BloodGroup, Donor} from '../types/bloodconnect.ts';
import {
  BLOOD_GROUPS,
  formatExactTimestamp,
  formatTimeAgo,
  getCompatibleDonorGroups,
  haversineKm,
} from '../utils/compatibility.ts';

export function FindDonorsPage() {
  const {
    donors,
    bloodBanks,
    coverageScope,
    setCoverageScope,
    selectedCity,
    preselectedBloodGroup,
    setPreselectedBloodGroup,
    logDonorContact,
    currentUser,
  } = usePortal();

  const [includeCompatible, setIncludeCompatible] = useState(true);
  const [availableOnly, setAvailableOnly] = useState(true);
  const [includeUnverified, setIncludeUnverified] = useState(false);
  const [query, setQuery] = useState('');

  // Contact Donor Modal State
  const [contactTarget, setContactTarget] = useState<Donor | null>(null);
  const [reqName, setReqName] = useState(currentUser?.name ?? '');
  const [reqPhone, setReqPhone] = useState(currentUser?.phone ?? '');
  const [reqHospital, setReqHospital] = useState('');
  const [revealedDonorIds, setRevealedDonorIds] = useState<Record<string, boolean>>({});
  const [contactConfirmed, setContactConfirmed] = useState(false);

  const cityMeta = useMemo(
    () => CITIES.find((c) => c.name === selectedCity) ?? CITIES[0],
    [selectedCity]
  );

  const compatibleGroups = useMemo(() => {
    if (preselectedBloodGroup === 'ALL') return BLOOD_GROUPS;
    return includeCompatible ? getCompatibleDonorGroups(preselectedBloodGroup) : [preselectedBloodGroup];
  }, [preselectedBloodGroup, includeCompatible]);

  const filteredDonors = useMemo(() => {
    return donors
      .filter((d) => {
        if (d.verificationStatus === 'rejected') return false;
        if (!includeUnverified && d.verificationStatus !== 'verified') return false;
        if (availableOnly && d.availability !== 'available') return false;
        if (!compatibleGroups.includes(d.bloodGroup)) return false;

        if (coverageScope === 'karnataka' && d.state !== 'Karnataka') return false;
        if (coverageScope === 'city' && d.city !== selectedCity) return false;

        if (query.trim()) {
          const q = query.trim().toLowerCase();
          const match =
            d.name.toLowerCase().includes(q) ||
            d.city.toLowerCase().includes(q) ||
            d.locality.toLowerCase().includes(q) ||
            d.bloodGroup.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .map((d) => ({
        donor: d,
        distanceKm: haversineKm(cityMeta.lat, cityMeta.lng, d.lat, d.lng),
      }))
      .sort((a, b) => {
        // Verified donors always sorted ahead of unverified
        if (a.donor.verificationStatus !== b.donor.verificationStatus) {
          return a.donor.verificationStatus === 'verified' ? -1 : 1;
        }
        return a.distanceKm - b.distanceKm;
      });
  }, [
    donors,
    includeUnverified,
    availableOnly,
    compatibleGroups,
    coverageScope,
    selectedCity,
    query,
    cityMeta,
  ]);

  const scopedBanks = useMemo(
    () =>
      bloodBanks.filter((b) => {
        if (coverageScope === 'karnataka') return b.state === 'Karnataka';
        if (coverageScope === 'city') return b.city === selectedCity;
        return true;
      }),
    [bloodBanks, coverageScope, selectedCity]
  );

  const handleOpenContact = (donor: Donor) => {
    setContactTarget(donor);
    setContactConfirmed(false);
    if (currentUser) {
      setReqName(currentUser.name);
      setReqPhone(currentUser.phone);
    }
  };

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactTarget || !reqName.trim() || !reqPhone.trim() || !reqHospital.trim()) return;
    logDonorContact({
      donorId: contactTarget.id,
      donorName: contactTarget.name,
      requesterName: reqName.trim(),
      requesterPhone: reqPhone.trim(),
      hospitalName: reqHospital.trim(),
      bloodGroup: contactTarget.bloodGroup,
    });
    setRevealedDonorIds((prev) => ({...prev, [contactTarget.id]: true}));
    setContactConfirmed(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-2 min-w-0">
          <p className="text-xs font-medium text-red-700">Verified Donor Directory</p>
          <h1 className="font-display font-bold text-3xl text-slate-900">Find Blood Donors</h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Search coordinator-verified voluntary donors by blood group, compatibility, and city
            proximity. Unverified registrations are excluded by default.
          </p>
        </div>

        <div className="w-full lg:w-auto lg:shrink-0 max-w-full">
          <CoverageSelector variant="compact" alwaysShowCitySelect citySelectPrefix="Near" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPreselectedBloodGroup('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              preselectedBloodGroup === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
            }`}
          >
            All Groups
          </button>
          {BLOOD_GROUPS.map((group: BloodGroup) => (
            <button
              key={group}
              type="button"
              onClick={() => setPreselectedBloodGroup(group)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold border transition-colors cursor-pointer ${
                preselectedBloodGroup === group
                  ? 'bg-red-600 text-white border-red-700'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-red-300'
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2 border-t border-slate-100">
          <div className="md:col-span-5 relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by donor name, locality, or city..."
              className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            />
          </div>

          <div className="md:col-span-7 flex flex-wrap items-center gap-5 text-xs text-slate-700">
            {preselectedBloodGroup !== 'ALL' && (
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCompatible}
                  onChange={(e) => setIncludeCompatible(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-600"
                />
                <span>
                  Include ABO/Rh compatible ({compatibleGroups.join(', ')})
                </span>
              </label>
            )}

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded border-slate-300 text-red-600 focus:ring-red-600"
              />
              <span>Available now only</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeUnverified}
                onChange={(e) => setIncludeUnverified(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-600"
              />
              <span>Include unverified registrations (unconfirmed)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Spatial Map */}
      <SpatialProximityMap
        centerCityName={selectedCity}
        coverageScope={coverageScope}
        donors={filteredDonors.map((item) => item.donor)}
        bloodBanks={scopedBanks}
        onSelectDonor={(donor) => handleOpenContact(donor)}
        title="Donor & Blood Bank Proximity Map"
      />

      {/* Results Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-900 tabular-nums">
          Showing {filteredDonors.length} donor{filteredDonors.length === 1 ? '' : 's'}
        </p>
        {!includeUnverified && (
          <p className="text-xs text-slate-500">
            Only coordinator-verified donors are shown. Pending registrations await review.
          </p>
        )}
      </div>

      {/* Donor Cards Grid */}
      {filteredDonors.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <p className="font-display font-semibold text-slate-900">
            No matching donors found for the current filters
          </p>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Try switching coverage to Karnataka State or Entire India, or enabling compatible blood
            groups.
          </p>
          <button
            type="button"
            onClick={() => {
              setCoverageScope('all_india');
              setPreselectedBloodGroup('ALL');
              setAvailableOnly(false);
              setQuery('');
            }}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            Reset Filters to All India
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDonors.map(({donor, distanceKm}) => {
            const isVerified = donor.verificationStatus === 'verified';
            const isRevealed = revealedDonorIds[donor.id];

            return (
              <div
                key={donor.id}
                className={`bg-white border rounded-xl p-5 flex flex-col justify-between space-y-4 ${
                  isVerified ? 'border-slate-200' : 'border-amber-300 bg-amber-50/30'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-900">
                        {donor.name}
                      </h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        <span>
                          {donor.locality}, {donor.city} ·{' '}
                          <span className="font-mono tabular-nums">{distanceKm} km</span>
                        </span>
                      </p>
                    </div>
                    <span className="font-display font-extrabold text-lg text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1 shrink-0">
                      {donor.bloodGroup}
                    </span>
                  </div>

                  {/* Verification & Availability Metadata (Zero-pill clean text with separators) */}
                  <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      {isVerified ? (
                        <>
                          <ShieldCheck
                            className="w-3.5 h-3.5 text-emerald-700 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="font-medium text-emerald-800">Verified Donor</span>
                          <span className="text-slate-400" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-slate-500 font-mono tabular-nums">
                            {formatTimeAgo(donor.verifiedAt ?? donor.registeredAt)}
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert
                            className="w-3.5 h-3.5 text-amber-700 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="font-medium text-amber-800">
                            Unverified Registration (Not Confirmed)
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-slate-600 flex flex-wrap items-center gap-1.5">
                      <span
                        className={
                          donor.availability === 'available'
                            ? 'text-slate-900 font-medium'
                            : 'text-slate-500'
                        }
                      >
                        {donor.availability === 'available'
                          ? 'Available for donation'
                          : donor.availability === 'recently_donated'
                          ? 'Recently donated (cooling period)'
                          : 'Currently unavailable'}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono tabular-nums text-slate-500">
                        Updated {formatTimeAgo(donor.lastAvailabilityUpdatedAt)}
                      </span>
                    </div>

                    <p className="text-slate-500 tabular-nums">
                      {donor.donationCount} lifetime donations
                      {donor.lastDonationDate ? ` · Last: ${donor.lastDonationDate}` : ''}
                    </p>
                  </div>
                </div>

                {isRevealed ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                    <p className="font-semibold text-emerald-900">Contact Logged &amp; Unlocked</p>
                    <p className="font-mono text-emerald-900">{donor.phone}</p>
                    <p className="text-emerald-800">{donor.email}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenContact(donor)}
                    disabled={!isVerified}
                    className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                      isVerified
                        ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                        : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {isVerified ? 'Contact Verified Donor' : 'Awaiting Admin Verification'}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Contact Donor Modal */}
      {contactTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-donor-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-5 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="contact-donor-title" className="font-display font-bold text-lg text-slate-900">
                  Contact {contactTarget.name} ({contactTarget.bloodGroup})
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {contactTarget.locality}, {contactTarget.city} · Verified{' '}
                  {formatExactTimestamp(contactTarget.verifiedAt ?? contactTarget.registeredAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setContactTarget(null)}
                aria-label="Close contact dialog"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {contactConfirmed ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>Inquiry Recorded &amp; Contact Unlocked</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Please share your patient IP/ward number and blood bank requisition slip when
                    calling.
                  </p>
                  <div className="pt-2 border-t border-emerald-200 font-mono text-sm text-emerald-950 space-y-1">
                    <p>Phone: {contactTarget.phone}</p>
                    <p>Email: {contactTarget.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setContactTarget(null)}
                  className="w-full py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitContact} className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2 text-xs text-slate-600">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    To protect donor privacy and prevent spam, log your hospital &amp; requester
                    contact before viewing phone details.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Requester Name
                  </label>
                  <input
                    type="text"
                    required
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    placeholder="e.g. Deepa Suresh"
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Requester Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={reqPhone}
                    onChange={(e) => setReqPhone(e.target.value)}
                    placeholder="+91 98455 10293"
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hospital Name &amp; Ward
                  </label>
                  <input
                    type="text"
                    required
                    value={reqHospital}
                    onChange={(e) => setReqHospital(e.target.value)}
                    placeholder="e.g. Manipal Hospital, Old Airport Rd"
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setContactTarget(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Reveal Donor Contact
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
