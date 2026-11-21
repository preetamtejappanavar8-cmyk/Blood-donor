import React, {useMemo, useState} from 'react';
import {
  ArrowRight,
  Building2,
  Clock,
  HeartHandshake,
  ShieldCheck,
  Siren,
  Users,
} from 'lucide-react';
import {ResilientImage} from '../components/ResilientImage.tsx';
import {usePortal} from '../context/PortalContext.tsx';
import {CITIES} from '../data/seedData.ts';
import {BloodGroup, CoverageScope} from '../types/bloodconnect.ts';
import {BLOOD_GROUPS} from '../utils/compatibility.ts';
import heroBloodDonationImg from '../assets/images/hero_blood_donation_1795278439284.jpg';
import bloodBankLabImg from '../assets/images/blood_bank_lab_1795278440324.jpg';
import communityDonorCampImg from '../assets/images/community_donor_camp_1795278439848.jpg';

export function HomePage() {
  const {
    donors,
    bloodBanks,
    requests,
    coverageScope,
    setCoverageScope,
    selectedCity,
    setSelectedCity,
    setPreselectedBloodGroup,
    navigate,
    currentUser,
  } = usePortal();

  const [heroBloodGroup, setHeroBloodGroup] = useState<BloodGroup>('O+');

  const scopedCities = useMemo(
    () => (coverageScope === 'karnataka' ? CITIES.filter((c) => c.inKarnataka) : CITIES),
    [coverageScope]
  );

  // Strictly compute metrics from VERIFIED donors & verified bank inventory
  const metrics = useMemo(() => {
    const matchesScope = (state: string, city: string) => {
      if (coverageScope === 'all_india') return true;
      if (coverageScope === 'karnataka') return state === 'Karnataka';
      return city === selectedCity;
    };

    const verifiedAvailableDonors = donors.filter(
      (d) =>
        d.verificationStatus === 'verified' &&
        d.availability === 'available' &&
        matchesScope(d.state, d.city)
    ).length;

    const pendingDonorCount = donors.filter(
      (d) => d.verificationStatus === 'pending_review' && matchesScope(d.state, d.city)
    ).length;

    const scopedBanks = bloodBanks.filter((b) => matchesScope(b.state, b.city));
    const confirmedUnits = scopedBanks.reduce(
      (sum, bank) =>
        sum + BLOOD_GROUPS.reduce((bSum, g) => bSum + bank.stock[g].confirmedUnits, 0),
      0
    );

    const openRequests = requests.filter(
      (r) =>
        r.status !== 'fulfilled' &&
        r.status !== 'flagged_duplicate' &&
        matchesScope(r.state, r.city)
    ).length;

    return {
      verifiedAvailableDonors,
      pendingDonorCount,
      bankCount: scopedBanks.length,
      confirmedUnits,
      openRequests,
    };
  }, [donors, bloodBanks, requests, coverageScope, selectedCity]);

  const handleHeroSearch = () => {
    setPreselectedBloodGroup(heroBloodGroup);
    navigate('find-donors');
  };

  const handleScopeChange = (nextScope: CoverageScope) => {
    setCoverageScope(nextScope);
    if (nextScope === 'karnataka') {
      const isKarnatakaCity = CITIES.find((c) => c.name === selectedCity)?.inKarnataka;
      if (!isKarnatakaCity) setSelectedCity('Bengaluru');
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section: Asymmetric Split with Need Blood Urgently Selector */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
          {/* Coverage Scope Bar (All India / Karnataka / One City) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-slate-500">Coverage Area</span>
              <div
                className="inline-flex items-center p-1 bg-slate-100 rounded-lg"
                role="group"
                aria-label="Portal Coverage Scope"
              >
                {(
                  [
                    {id: 'all_india', label: 'Entire India'},
                    {id: 'karnataka', label: 'Karnataka State'},
                    {id: 'city', label: 'Single City'},
                  ] as {id: CoverageScope; label: string}[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleScopeChange(item.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      coverageScope === item.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {coverageScope === 'city' && (
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  aria-label="Select City"
                  className="text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  {CITIES.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}, {city.state}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>Verified &amp; timestamped inventory</span>
              <span className="text-slate-300" aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                onClick={() => navigate('auth')}
                className="font-semibold text-slate-900 hover:text-red-700 underline underline-offset-4 cursor-pointer"
              >
                {currentUser ? `Signed in: ${currentUser.name}` : 'Login / Register'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            {/* Left Column: Headline + Need Blood Urgently Selector */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
              <div className="space-y-5">
                <p className="inline-block text-xs font-semibold tracking-wide text-red-700 pb-1.5 border-b border-red-200">
                  Verified Blood Donor &amp; Emergency Network
                </p>
                <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[3.5rem] tracking-[-0.035em] text-slate-900 text-balance leading-[1.06]">
                  <span className="block">Donate Blood.</span>
                  <span className="relative inline-block mt-1">
                    <span className="bg-gradient-to-r from-red-700 via-red-600 to-rose-600 bg-clip-text text-transparent">
                      Save Lives.
                    </span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 220 12"
                      fill="none"
                      className="absolute -bottom-1.5 left-0 w-full h-2.5 text-red-500/40"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M2 9.5C58 3.2 146 2.2 218 7.5"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h1>
                <p className="text-base sm:text-[17px] text-slate-600 max-w-[54ch] leading-[1.65] pt-1">
                  <span className="font-display font-semibold text-slate-900">
                    Every drop counts.
                  </span>{' '}
                  Connect with{' '}
                  <span className="font-medium text-slate-800 underline decoration-red-200 decoration-2 underline-offset-4">
                    verified blood donors
                  </span>{' '}
                  and inspect{' '}
                  <span className="font-medium text-slate-800 underline decoration-slate-300 decoration-2 underline-offset-4">
                    timestamped blood bank stock
                  </span>{' '}
                  before dispatching an urgent hospital request.
                </p>
              </div>

              {/* Need Blood Urgently? Interactive Selector */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="font-display font-bold text-lg text-slate-900">
                      Need Blood Urgently?
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Find coordinator-verified donors in your area.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-500">Select Blood Group</span>
                </div>

                <div
                  className="grid grid-cols-4 gap-2"
                  role="radiogroup"
                  aria-label="Select Required Blood Group"
                >
                  {BLOOD_GROUPS.map((group) => {
                    const selected = heroBloodGroup === group;
                    return (
                      <button
                        key={group}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setHeroBloodGroup(group)}
                        className={`h-11 rounded-lg font-display font-bold text-sm transition-colors border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
                          selected
                            ? 'bg-red-600 text-white border-red-700'
                            : 'bg-white text-slate-900 border-slate-200 hover:border-red-400 hover:text-red-700'
                        }`}
                      >
                        {group}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                  <div className="sm:col-span-5">
                    <label htmlFor="hero-city" className="sr-only">
                      City
                    </label>
                    <select
                      id="hero-city"
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value);
                        setCoverageScope('city');
                      }}
                      className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                    >
                      {scopedCities.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} ({c.state})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-7">
                    <button
                      type="button"
                      onClick={handleHeroSearch}
                      className="w-full h-11 px-5 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
                    >
                      <span>Find Blood Donors</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Editorial Documentary Photograph */}
            <div className="lg:col-span-6 flex">
              <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 min-h-[320px]">
                <ResilientImage
                  src={heroBloodDonationImg}
                  alt="Medical coordinator checking verified blood unit records inside an Indian hospital blood donation center"
                  fallbackTitle="BloodConnect Clinical Coordination Centre"
                  className="w-full h-full object-cover lg:absolute lg:inset-0"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent p-6 text-white">
                  <p className="text-xs font-mono text-slate-200 tabular-nums">
                    Verification Policy · Unconfirmed registrations excluded
                  </p>
                  <p className="text-sm font-medium mt-1 text-white max-w-md">
                    Every donor screening and blood bank stock count carries an explicit verification
                    timestamp before appearing as confirmed available blood.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width 4-Column Verified KPI Strip Below Hero */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-200">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Confirmed Blood Units</span>
                <Building2 className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </div>
              <p className="mt-2 font-display font-bold text-2xl sm:text-3xl text-slate-900 tabular-nums">
                {metrics.confirmedUnits}
              </p>
              <p className="mt-1 text-xs text-slate-500">Timestamped across {metrics.bankCount} banks</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Verified Available Donors</span>
                <Users className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </div>
              <p className="mt-2 font-display font-bold text-2xl sm:text-3xl text-slate-900 tabular-nums">
                {metrics.verifiedAvailableDonors}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {metrics.pendingDonorCount} pending review excluded
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Licensed Blood Banks</span>
                <ShieldCheck className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </div>
              <p className="mt-2 font-display font-bold text-2xl sm:text-3xl text-slate-900 tabular-nums">
                {metrics.bankCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">24×7 emergency cross-match desks</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Active Emergency Requests</span>
                <Siren className="w-4 h-4 text-red-600" aria-hidden="true" />
              </div>
              <p className="mt-2 font-display font-bold text-2xl sm:text-3xl text-slate-900 tabular-nums">
                {metrics.openRequests}
              </p>
              <p className="mt-1 text-xs text-slate-500">Live coordinator dispatch queue</p>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Action Pathways: Become a Donor & Emergency Request */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800">
                <HeartHandshake className="w-4 h-4" aria-hidden="true" />
                <span>Voluntary Donor Registry</span>
              </div>
              <h2 className="font-display font-bold text-2xl text-slate-900">Become a Donor</h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md">
                Register your blood group, locality, and availability status. Once verified by a
                regional coordinator, hospitals and patients can reach you during urgent shortages.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('become-donor')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Become a Donor
              </button>
              <span className="text-xs text-slate-500">Takes under 2 minutes</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-red-700">
                <Siren className="w-4 h-4" aria-hidden="true" />
                <span>Hospital &amp; Trauma Dispatch</span>
              </div>
              <h2 className="font-display font-bold text-2xl text-slate-900">Emergency Request</h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md">
                Request blood quickly with patient hospital details, component specification, and
                real-time request status tracking from submission through donor match.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('emergency-request')}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Submit Emergency Request
              </button>
              <button
                type="button"
                onClick={() => navigate('blood-availability')}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 underline underline-offset-4 cursor-pointer"
              >
                Check Blood Bank Stock
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Verification & Network Architecture Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-red-700">Clinical Trust Protocol</p>
              <h2 className="font-display font-bold text-3xl text-slate-900 text-balance">
                Why every unit and donor is verified and timestamped
              </h2>
            </div>

            <div className="space-y-5 pt-2">
              <div className="pb-4 border-b border-slate-200">
                <h3 className="text-base font-semibold text-slate-900">
                  01. No unverified donors shown as confirmed stock
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  New self-registrations enter a pending coordinator queue and are excluded from
                  confirmed donor counts until screened and approved.
                </p>
              </div>
              <div className="pb-4 border-b border-slate-200">
                <h3 className="text-base font-semibold text-slate-900">
                  02. Freshness timestamps on blood bank units
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Every blood bank displays the exact time its inventory was verified and flags
                  aging counts over 12 hours old so attendants never chase stale stock.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  03. Duplicate &amp; fake request screening
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Incoming emergency requests are checked against active hospital and phone records
                  to prevent duplicate alerts and donor fatigue.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                <ResilientImage
                  src={bloodBankLabImg}
                  alt="Licensed blood bank cold storage laboratory with labeled blood unit shelves"
                  fallbackTitle="Licensed Blood Bank Storage"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>Live Component Ledger</span>
                </div>
                <p className="font-semibold text-sm text-slate-900">Blood Availability Matrix</p>
                <button
                  type="button"
                  onClick={() => navigate('blood-availability')}
                  className="text-xs font-medium text-red-700 hover:underline pt-1 cursor-pointer"
                >
                  Inspect verified units →
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                <ResilientImage
                  src={communityDonorCampImg}
                  alt="Volunteer nurse speaking with a blood donor at a community blood donation camp"
                  fallbackTitle="Voluntary Community Donor Drive"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>Verified Volunteer Network</span>
                </div>
                <p className="font-semibold text-sm text-slate-900">Find Nearby Blood Banks</p>
                <button
                  type="button"
                  onClick={() => navigate('blood-banks')}
                  className="text-xs font-medium text-red-700 hover:underline pt-1 cursor-pointer"
                >
                  Browse licensed centers →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
