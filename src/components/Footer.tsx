import React from 'react';
import {Droplet, ShieldCheck} from 'lucide-react';
import {usePortal} from '../context/PortalContext.tsx';
import {PageId} from '../types/bloodconnect.ts';

export function Footer() {
  const {navigate, currentUser, logout} = usePortal();

  const links: {id: PageId; label: string}[] = [
    {id: 'home', label: 'Home'},
    {id: 'find-donors', label: 'Find Donors'},
    {id: 'become-donor', label: 'Become a Donor'},
    {id: 'emergency-request', label: 'Emergency Request'},
    {id: 'blood-availability', label: 'Blood Availability'},
    {id: 'blood-banks', label: 'Blood Banks'},
    {id: 'auth', label: 'Login / Register'},
    {id: 'admin', label: 'Admin Dashboard'},
  ];

  return (
    <footer className="bg-white border-t border-slate-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-200">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2 text-lg font-display font-bold text-slate-900">
              <Droplet className="w-5 h-5 text-red-600 fill-red-600" aria-hidden="true" />
              <span>BloodConnect</span>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Verified blood donor registry and emergency blood availability portal serving Karnataka
              and major metropolitan centers across India.
            </p>
            <div className="flex items-start gap-2 text-xs text-slate-600 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Verification Standard: Only coordinator-verified donors and timestamped blood bank
                units are shown as confirmed available blood.
              </span>
            </div>
          </div>

          <div className="md:col-span-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Portal Pages</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {links.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => navigate(link.id)}
                  className="text-left text-sm text-slate-600 hover:text-red-700 transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Account Session</h3>
            {currentUser ? (
              <div className="space-y-2 text-sm text-slate-600">
                <p className="font-medium text-slate-900">{currentUser.name}</p>
                <p className="text-xs text-slate-500">
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} ·{' '}
                  {currentUser.city}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate('auth')}
                    className="text-xs font-medium text-red-700 hover:underline cursor-pointer"
                  >
                    Switch Account
                  </button>
                  <span className="text-slate-300" aria-hidden="true">
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  Sign in as a donor, hospital requester, or coordinator admin.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('auth')}
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Login / Register
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <p>BloodConnect Civic Health Portal · Karnataka &amp; Pan-India Network</p>
          <p>24×7 Emergency Coordination Helpline: 104 / 1910 (e-RaktKosh Standard)</p>
        </div>
      </div>
    </footer>
  );
}
