import React from 'react';
import {Mail, X} from 'lucide-react';
import {Footer} from './components/Footer.tsx';
import {Navbar} from './components/Navbar.tsx';
import {PortalProvider, usePortal} from './context/PortalContext.tsx';
import {AdminDashboardPage} from './pages/AdminDashboardPage.tsx';
import {AuthPage} from './pages/AuthPage.tsx';
import {BecomeDonorPage} from './pages/BecomeDonorPage.tsx';
import {BloodAvailabilityPage} from './pages/BloodAvailabilityPage.tsx';
import {BloodBanksPage} from './pages/BloodBanksPage.tsx';
import {EmergencyRequestPage} from './pages/EmergencyRequestPage.tsx';
import {FindDonorsPage} from './pages/FindDonorsPage.tsx';
import {HomePage} from './pages/HomePage.tsx';

function PortalRouter() {
  const {currentPage, lastEmailAlert, dismissLastEmailAlert, navigate} = usePortal();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'find-donors' && <FindDonorsPage />}
        {currentPage === 'become-donor' && <BecomeDonorPage />}
        {currentPage === 'emergency-request' && <EmergencyRequestPage />}
        {currentPage === 'blood-availability' && <BloodAvailabilityPage />}
        {currentPage === 'blood-banks' && <BloodBanksPage />}
        {currentPage === 'auth' && <AuthPage />}
        {currentPage === 'admin' && <AdminDashboardPage />}
      </main>
      <Footer />

      {lastEmailAlert && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 max-w-sm bg-white border border-slate-300 rounded-xl shadow-lg p-4 flex items-start gap-3"
        >
          <Mail className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs space-y-1 flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">
              {lastEmailAlert.status === 'sent'
                ? `Email sent to ${lastEmailAlert.recipient}`
                : `Alert logged for ${lastEmailAlert.recipient}`}
            </p>
            <p className="text-slate-600 truncate">{lastEmailAlert.subject}</p>
            <button
              type="button"
              onClick={() => {
                dismissLastEmailAlert();
                navigate('admin');
              }}
              className="text-red-700 font-medium hover:underline cursor-pointer"
            >
              View in Admin Email Alerts →
            </button>
          </div>
          <button
            type="button"
            onClick={dismissLastEmailAlert}
            aria-label="Dismiss notification alert"
            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <PortalProvider>
      <PortalRouter />
    </PortalProvider>
  );
}
