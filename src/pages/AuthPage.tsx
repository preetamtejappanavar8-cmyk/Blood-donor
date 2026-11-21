import React, {useState} from 'react';
import {CheckCircle2, LogOut, ShieldCheck, UserCheck, Users} from 'lucide-react';
import {usePortal} from '../context/PortalContext.tsx';
import {CITIES} from '../data/seedData.ts';
import {UserRole} from '../types/bloodconnect.ts';

export function AuthPage() {
  const {currentUser, login, registerAccount, quickDemoSignIn, logout, navigate} = usePortal();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [role, setRole] = useState<UserRole>('donor');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = login(email, password);
    if (!res.ok) {
      setError(res.error ?? 'Login failed');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cityMeta = CITIES.find((c) => c.name === city) ?? CITIES[0];
    const res = registerAccount({
      name,
      email,
      password,
      role,
      city: cityMeta.name,
      state: cityMeta.state,
      phone,
    });
    if (!res.ok) {
      setError(res.error ?? 'Registration failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <p className="text-xs font-medium text-red-700">Portal Accounts &amp; Role Access</p>
        <h1 className="font-display font-bold text-3xl text-slate-900">Login / Register</h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Sign in to manage your donor availability, track hospital requests, or access coordinator
          verification tools in the Admin Dashboard.
        </p>
      </div>

      {currentUser ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 max-w-xl space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Active Session</span>
              </div>
              <h2 className="font-display font-bold text-2xl text-slate-900">{currentUser.name}</h2>
              <p className="text-sm text-slate-600">
                {currentUser.email} · Role:{' '}
                <span className="font-semibold text-slate-900 capitalize">{currentUser.role}</span> ·{' '}
                {currentUser.city}, {currentUser.state}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => navigate('admin')}
                className="px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Open Admin Dashboard
              </button>
            )}
            {currentUser.role === 'donor' && (
              <button
                type="button"
                onClick={() => navigate('become-donor')}
                className="px-4 py-2.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 cursor-pointer"
              >
                Manage My Donor Availability
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('find-donors')}
              className="px-4 py-2.5 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Find Donors
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Login / Register Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="inline-flex p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <p className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                {error}
              </p>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="karthik.r@example.in"
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98450 00000"
                      className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
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
                      placeholder="name@example.in"
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Account Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="donor">Blood Donor</option>
                      <option value="requester">Patient / Hospital Requester</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create password"
                      className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </form>
            )}
          </div>

          {/* Instant Role Access Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display font-bold text-base text-slate-900">
              Quick Role Access (Demo Accounts)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Test the donor availability portal, hospital requester workflow, or coordinator
              verification dashboard with one click.
            </p>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  quickDemoSignIn('donor');
                  navigate('become-donor');
                }}
                className="w-full p-3.5 text-left border border-slate-200 hover:border-red-300 rounded-xl transition-colors flex items-start gap-3 cursor-pointer"
              >
                <UserCheck className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Sign in as Verified Donor
                  </p>
                  <p className="text-xs text-slate-500">
                    Karthik Rajagopal (O-) · Bengaluru · Toggle availability &amp; view requests
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  quickDemoSignIn('admin');
                  navigate('admin');
                }}
                className="w-full p-3.5 text-left border border-slate-200 hover:border-slate-400 rounded-xl transition-colors flex items-start gap-3 cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Sign in as Portal Coordinator Admin
                  </p>
                  <p className="text-xs text-slate-500">
                    Dr. Meera Nair · Verify donors, blood bank timestamps, &amp; duplicate requests
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  quickDemoSignIn('requester');
                  navigate('emergency-request');
                }}
                className="w-full p-3.5 text-left border border-slate-200 hover:border-slate-400 rounded-xl transition-colors flex items-start gap-3 cursor-pointer"
              >
                <Users className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Sign in as Hospital / Family Requester
                  </p>
                  <p className="text-xs text-slate-500">
                    Deepa Suresh · Submit &amp; track emergency blood requests
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
