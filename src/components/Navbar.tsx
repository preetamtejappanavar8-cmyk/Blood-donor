import React, {useState} from 'react';
import {Droplet, Menu, X} from 'lucide-react';
import {usePortal} from '../context/PortalContext.tsx';
import {PageId} from '../types/bloodconnect.ts';

const TOP_NAV_LINKS: {id: PageId; label: string}[] = [
  {id: 'find-donors', label: 'Find Donors'},
  {id: 'blood-availability', label: 'Availability'},
  {id: 'blood-banks', label: 'Blood Banks'},
  {id: 'become-donor', label: 'Become Donor'},
  {id: 'admin', label: 'Admin'},
];

const MOBILE_ALL_LINKS: {id: PageId; label: string}[] = [
  {id: 'home', label: 'Home'},
  {id: 'find-donors', label: 'Find Donors'},
  {id: 'blood-availability', label: 'Blood Availability'},
  {id: 'blood-banks', label: 'Blood Banks'},
  {id: 'become-donor', label: 'Become a Donor'},
  {id: 'emergency-request', label: 'Emergency Request'},
  {id: 'auth', label: 'Login / Register'},
  {id: 'admin', label: 'Admin Dashboard'},
];

export function Navbar() {
  const {currentPage, navigate} = usePortal();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id: PageId) => {
    navigate(id);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="inline-flex items-center gap-2 text-lg font-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded-md px-1 py-1 cursor-pointer"
        >
          <Droplet className="w-5 h-5 text-red-600 fill-red-600" aria-hidden="true" />
          <span>BloodConnect</span>
        </button>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary Navigation">
          {TOP_NAV_LINKS.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded-t ${
                  active
                    ? 'text-red-700 border-red-600'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('emergency-request')}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
          >
            Emergency Request
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {MOBILE_ALL_LINKS.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-red-50 text-red-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
