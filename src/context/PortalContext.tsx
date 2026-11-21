import React, {createContext, useContext, useEffect, useState} from 'react';
import {
  CITIES,
  INITIAL_BLOOD_BANKS,
  INITIAL_DONORS,
  INITIAL_REQUESTS,
  INITIAL_USERS,
} from '../data/seedData.ts';
import {
  BloodBank,
  BloodComponent,
  BloodGroup,
  ContactLog,
  CoverageScope,
  Donor,
  DonorAvailability,
  EmailNotificationEventType,
  EmailNotificationRecord,
  EmergencyRequest,
  PageId,
  RequestStatus,
  RequestUrgency,
  ReservationLog,
  UserAccount,
  UserRole,
} from '../types/bloodconnect.ts';
import {detectPotentialDuplicateRequest} from '../utils/compatibility.ts';

const STORAGE_KEY = 'bloodconnect_portal_state_v1';

interface PortalPersistedState {
  donors: Donor[];
  bloodBanks: BloodBank[];
  requests: EmergencyRequest[];
  users: UserAccount[];
  contactLogs: ContactLog[];
  reservationLogs: ReservationLog[];
  currentUserId: string | null;
  coverageScope: CoverageScope;
  selectedCity: string;
}

interface PortalContextValue extends PortalPersistedState {
  currentPage: PageId;
  navigate: (page: PageId) => void;
  preselectedBloodGroup: BloodGroup | 'ALL';
  setPreselectedBloodGroup: (group: BloodGroup | 'ALL') => void;
  currentUser: UserAccount | null;
  setCoverageScope: (scope: CoverageScope) => void;
  setSelectedCity: (city: string) => void;
  emailNotifications: EmailNotificationRecord[];
  emailConfigured: boolean;
  notificationRecipient: string;
  lastEmailAlert: EmailNotificationRecord | null;
  dismissLastEmailAlert: () => void;
  // Auth
  login: (email: string, password: string) => {ok: boolean; error?: string};
  registerAccount: (input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    city: string;
    state: string;
    phone: string;
  }) => {ok: boolean; error?: string};
  quickDemoSignIn: (role: UserRole) => void;
  logout: () => void;
  // Donors
  registerDonor: (input: {
    name: string;
    phone: string;
    email: string;
    bloodGroup: BloodGroup;
    city: string;
    locality: string;
    availability: DonorAvailability;
    lastDonationDate?: string;
    age: number;
    weightKg: number;
  }) => Donor;
  updateDonorAvailability: (donorId: string, availability: DonorAvailability) => void;
  respondToEmergencyOffer: (requestId: string, donorId: string, accept: boolean) => void;
  // Emergency Requests & Contact
  submitEmergencyRequest: (input: {
    patientName: string;
    hospitalName: string;
    city: string;
    locality: string;
    bloodGroup: BloodGroup;
    component: BloodComponent;
    unitsNeeded: number;
    urgency: RequestUrgency;
    contactName: string;
    contactPhone: string;
    notes: string;
    allowDuplicateOverride?: boolean;
  }) => {request?: EmergencyRequest; duplicateWarning?: EmergencyRequest};
  logDonorContact: (input: {
    donorId: string;
    donorName: string;
    requesterName: string;
    requesterPhone: string;
    hospitalName: string;
    bloodGroup: BloodGroup;
  }) => void;
  reserveBankUnits: (input: {
    bankId: string;
    bloodGroup: BloodGroup;
    units: number;
    patientName: string;
    requesterPhone: string;
  }) => {ok: boolean; error?: string};
  // Admin actions
  verifyDonor: (donorId: string) => void;
  rejectDonor: (donorId: string) => void;
  updateRequestStatus: (requestId: string, status: RequestStatus) => void;
  verifyAndTimestampBankStock: (
    bankId: string,
    updates?: Partial<Record<BloodGroup, {confirmedUnits: number; unverifiedHoldUnits: number}>>
  ) => void;
  resetDemoData: () => void;
}

const DEFAULT_PERSISTED_STATE: PortalPersistedState = {
  donors: INITIAL_DONORS,
  bloodBanks: INITIAL_BLOOD_BANKS,
  requests: INITIAL_REQUESTS,
  users: INITIAL_USERS,
  contactLogs: [],
  reservationLogs: [],
  currentUserId: null,
  coverageScope: 'karnataka',
  selectedCity: 'Bengaluru',
};

function loadInitialState(): PortalPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PERSISTED_STATE;
    const parsed = JSON.parse(raw) as Partial<PortalPersistedState>;
    return {
      donors: parsed.donors?.length ? parsed.donors : INITIAL_DONORS,
      bloodBanks: parsed.bloodBanks?.length ? parsed.bloodBanks : INITIAL_BLOOD_BANKS,
      requests: parsed.requests?.length ? parsed.requests : INITIAL_REQUESTS,
      users: parsed.users?.length ? parsed.users : INITIAL_USERS,
      contactLogs: parsed.contactLogs ?? [],
      reservationLogs: parsed.reservationLogs ?? [],
      currentUserId: parsed.currentUserId ?? null,
      coverageScope: parsed.coverageScope ?? 'karnataka',
      selectedCity: parsed.selectedCity ?? 'Bengaluru',
    };
  } catch {
    return DEFAULT_PERSISTED_STATE;
  }
}

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState<PortalPersistedState>(loadInitialState);
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [preselectedBloodGroup, setPreselectedBloodGroup] = useState<BloodGroup | 'ALL'>('ALL');
  const [emailNotifications, setEmailNotifications] = useState<EmailNotificationRecord[]>([]);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [notificationRecipient, setNotificationRecipient] = useState(
    'preetamtejappanavar8@gmail.com'
  );
  const [lastEmailAlert, setLastEmailAlert] = useState<EmailNotificationRecord | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [state]);

  useEffect(() => {
    let active = true;
    fetch('/api/notifications/logs')
      .then(async (res) => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('application/json')) return null;
        return res.json();
      })
      .then((data) => {
        if (!active || !data) return;
        if (typeof data.emailConfigured === 'boolean') setEmailConfigured(data.emailConfigured);
        if (typeof data.recipientEmail === 'string') setNotificationRecipient(data.recipientEmail);
        if (Array.isArray(data.logs)) setEmailNotifications(data.logs);
      })
      .catch(() => {
        // Ignore if running on static host (e.g. GitHub Pages) without Express backend
      });
    return () => {
      active = false;
    };
  }, []);

  const dismissLastEmailAlert = () => setLastEmailAlert(null);

  const dispatchOwnerNotification = (payload: {
    eventType: EmailNotificationEventType;
    title: string;
    actorName: string;
    actorPhone?: string;
    actorEmail?: string;
    bloodGroup?: string;
    city?: string;
    details?: string;
  }) => {
    const fallbackRecord: EmailNotificationRecord = {
      id: `ntf-local-${Date.now()}`,
      eventType: payload.eventType,
      recipient: notificationRecipient,
      subject: `[BloodConnect] ${payload.title} — ${payload.bloodGroup ?? 'Portal'} (${payload.city ?? 'India'})`,
      actorName: payload.actorName,
      actorPhone: payload.actorPhone ?? '',
      actorEmail: payload.actorEmail ?? '',
      bloodGroup: payload.bloodGroup ?? 'Not specified',
      city: payload.city ?? 'India',
      details: payload.details ?? '',
      status: 'logged_awaiting_smtp',
      provider: 'local_log',
      timestamp: new Date().toISOString(),
    };

    fetch('/api/notifications/event', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('application/json')) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.notification) {
          setEmailConfigured(Boolean(data.emailConfigured));
          setEmailNotifications((prev) => [data.notification, ...prev].slice(0, 50));
          setLastEmailAlert(data.notification);
        } else {
          setEmailNotifications((prev) => [fallbackRecord, ...prev].slice(0, 50));
          setLastEmailAlert(fallbackRecord);
        }
      })
      .catch(() => {
        setEmailNotifications((prev) => [fallbackRecord, ...prev].slice(0, 50));
        setLastEmailAlert(fallbackRecord);
      });
  };

  const navigate = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? null;

  const setCoverageScope = (coverageScope: CoverageScope) => {
    setState((prev) => ({...prev, coverageScope}));
  };

  const setSelectedCity = (selectedCity: string) => {
    setState((prev) => ({...prev, selectedCity}));
  };

  const login = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = state.users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );
    if (!user) {
      return {ok: false, error: 'Invalid email or password. Use demo credentials or create a new account.'};
    }
    setState((prev) => ({...prev, currentUserId: user.id}));
    return {ok: true};
  };

  const registerAccount = (input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    city: string;
    state: string;
    phone: string;
  }) => {
    const cleanEmail = input.email.trim().toLowerCase();
    if (state.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return {ok: false, error: 'An account with this email already exists.'};
    }
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: input.name.trim(),
      email: cleanEmail,
      password: input.password,
      role: input.role,
      city: input.city,
      state: input.state,
      phone: input.phone.trim(),
    };
    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUserId: newUser.id,
    }));
    dispatchOwnerNotification({
      eventType: 'account_registered',
      title: `New ${newUser.role} Account Registered`,
      actorName: newUser.name,
      actorPhone: newUser.phone,
      actorEmail: newUser.email,
      city: `${newUser.city}, ${newUser.state}`,
      details: `Role: ${newUser.role}. Registered on BloodConnect portal.`,
    });
    return {ok: true};
  };

  const quickDemoSignIn = (role: UserRole) => {
    const match = state.users.find((u) => u.role === role);
    if (match) {
      setState((prev) => ({...prev, currentUserId: match.id}));
    }
  };

  const logout = () => {
    setState((prev) => ({...prev, currentUserId: null}));
  };

  const registerDonor = (input: {
    name: string;
    phone: string;
    email: string;
    bloodGroup: BloodGroup;
    city: string;
    locality: string;
    availability: DonorAvailability;
    lastDonationDate?: string;
    age: number;
    weightKg: number;
  }): Donor => {
    const cityMeta = CITIES.find((c) => c.name === input.city) ?? CITIES[0];
    const now = new Date().toISOString();
    // Slight deterministic jitter so pins in the same city do not stack directly on top of one another
    const jitterLat = ((state.donors.length % 7) - 3) * 0.008;
    const jitterLng = ((state.donors.length % 5) - 2) * 0.008;

    const newDonor: Donor = {
      id: `dn-${Date.now()}`,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      bloodGroup: input.bloodGroup,
      state: cityMeta.state,
      city: cityMeta.name,
      locality: input.locality.trim(),
      lat: cityMeta.lat + jitterLat,
      lng: cityMeta.lng + jitterLng,
      availability: input.availability,
      // Mandatory safety rule: new registrations start unverified until coordinator review
      verificationStatus: 'pending_review',
      registeredAt: now,
      lastAvailabilityUpdatedAt: now,
      lastDonationDate: input.lastDonationDate || undefined,
      donationCount: 0,
      age: input.age,
      weightKg: input.weightKg,
    };

    setState((prev) => {
      const updatedUsers = prev.currentUserId
        ? prev.users.map((u) =>
            u.id === prev.currentUserId
              ? {...u, donorId: newDonor.id, role: u.role === 'admin' ? 'admin' : ('donor' as UserRole)}
              : u
          )
        : prev.users;
      return {
        ...prev,
        donors: [newDonor, ...prev.donors],
        users: updatedUsers,
      };
    });

    dispatchOwnerNotification({
      eventType: 'donor_registered',
      title: 'New Blood Donor Registered',
      actorName: newDonor.name,
      actorPhone: newDonor.phone,
      actorEmail: newDonor.email,
      bloodGroup: newDonor.bloodGroup,
      city: `${newDonor.locality}, ${newDonor.city}`,
      details: `Availability: ${newDonor.availability}. Age: ${newDonor.age}, Weight: ${newDonor.weightKg}kg. Status: Pending coordinator review.`,
    });

    return newDonor;
  };

  const updateDonorAvailability = (donorId: string, availability: DonorAvailability) => {
    const now = new Date().toISOString();
    const donor = state.donors.find((d) => d.id === donorId);
    setState((prev) => ({
      ...prev,
      donors: prev.donors.map((d) =>
        d.id === donorId ? {...d, availability, lastAvailabilityUpdatedAt: now} : d
      ),
    }));
    if (donor) {
      dispatchOwnerNotification({
        eventType: 'blood_donated',
        title:
          availability === 'recently_donated'
            ? 'Donor Recorded Blood Donation'
            : `Donor Availability Updated (${availability.replace('_', ' ')})`,
        actorName: donor.name,
        actorPhone: donor.phone,
        actorEmail: donor.email,
        bloodGroup: donor.bloodGroup,
        city: `${donor.locality}, ${donor.city}`,
        details: `Donor updated status to "${availability.replace('_', ' ')}".`,
      });
    }
  };

  const respondToEmergencyOffer = (requestId: string, donorId: string, accept: boolean) => {
    const now = new Date().toISOString();
    const donor = state.donors.find((d) => d.id === donorId);
    const reqItem = state.requests.find((r) => r.id === requestId);
    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) => {
        if (r.id !== requestId) return r;
        const matched = accept
          ? Array.from(new Set([...r.matchedDonorIds, donorId]))
          : r.matchedDonorIds.filter((id) => id !== donorId);
        const declined = !accept
          ? Array.from(new Set([...r.declinedDonorIds, donorId]))
          : r.declinedDonorIds;
        return {
          ...r,
          matchedDonorIds: matched,
          declinedDonorIds: declined,
          status: accept && r.status === 'verified' ? 'donors_notified' : r.status,
          updatedAt: now,
        };
      }),
    }));
    if (accept && donor && reqItem) {
      dispatchOwnerNotification({
        eventType: 'blood_donated',
        title: `Donor Accepted Blood Donation Request (${reqItem.id})`,
        actorName: donor.name,
        actorPhone: donor.phone,
        actorEmail: donor.email,
        bloodGroup: donor.bloodGroup,
        city: `${reqItem.hospitalName}, ${reqItem.city}`,
        details: `Donor pledged to donate for patient ${reqItem.patientName} (${reqItem.unitsNeeded} units needed).`,
      });
    }
  };

  const submitEmergencyRequest = (input: {
    patientName: string;
    hospitalName: string;
    city: string;
    locality: string;
    bloodGroup: BloodGroup;
    component: BloodComponent;
    unitsNeeded: number;
    urgency: RequestUrgency;
    contactName: string;
    contactPhone: string;
    notes: string;
    allowDuplicateOverride?: boolean;
  }) => {
    const potentialDup = detectPotentialDuplicateRequest(
      {
        contactPhone: input.contactPhone,
        hospitalName: input.hospitalName,
        bloodGroup: input.bloodGroup,
        city: input.city,
      },
      state.requests
    );

    if (potentialDup && !input.allowDuplicateOverride) {
      return {duplicateWarning: potentialDup};
    }

    const cityMeta = CITIES.find((c) => c.name === input.city) ?? CITIES[0];
    const now = new Date().toISOString();
    const requestNum = 844 + state.requests.length;

    const newReq: EmergencyRequest = {
      id: `REQ-2026-${requestNum}`,
      patientName: input.patientName.trim(),
      hospitalName: input.hospitalName.trim(),
      state: cityMeta.state,
      city: cityMeta.name,
      locality: input.locality.trim(),
      bloodGroup: input.bloodGroup,
      component: input.component,
      unitsNeeded: input.unitsNeeded,
      urgency: input.urgency,
      contactName: input.contactName.trim(),
      contactPhone: input.contactPhone.trim(),
      notes: input.notes.trim(),
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
      duplicateOfId: potentialDup?.id,
      matchedDonorIds: [],
      declinedDonorIds: [],
    };

    setState((prev) => ({
      ...prev,
      requests: [newReq, ...prev.requests],
    }));

    dispatchOwnerNotification({
      eventType: 'blood_requested',
      title: `Urgent Blood Request (${newReq.id})`,
      actorName: `${newReq.contactName} (Patient: ${newReq.patientName})`,
      actorPhone: newReq.contactPhone,
      bloodGroup: newReq.bloodGroup,
      city: `${newReq.hospitalName}, ${newReq.city}`,
      details: `${newReq.unitsNeeded} unit(s) of ${newReq.component} requested · Urgency: ${newReq.urgency}. ${newReq.notes}`,
    });

    return {request: newReq};
  };

  const logDonorContact = (input: {
    donorId: string;
    donorName: string;
    requesterName: string;
    requesterPhone: string;
    hospitalName: string;
    bloodGroup: BloodGroup;
  }) => {
    const log: ContactLog = {
      id: `cnt-${Date.now()}`,
      ...input,
      timestamp: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      contactLogs: [log, ...prev.contactLogs],
    }));
    dispatchOwnerNotification({
      eventType: 'donor_contacted',
      title: `Requester Contacted Donor (${input.donorName})`,
      actorName: input.requesterName,
      actorPhone: input.requesterPhone,
      bloodGroup: input.bloodGroup,
      city: input.hospitalName,
      details: `${input.requesterName} unlocked contact details for verified donor ${input.donorName} (${input.bloodGroup}).`,
    });
  };

  const reserveBankUnits = (input: {
    bankId: string;
    bloodGroup: BloodGroup;
    units: number;
    patientName: string;
    requesterPhone: string;
  }) => {
    const bank = state.bloodBanks.find((b) => b.id === input.bankId);
    if (!bank) return {ok: false, error: 'Blood bank not found.'};
    const available = bank.stock[input.bloodGroup].confirmedUnits;
    if (input.units <= 0 || input.units > available) {
      return {ok: false, error: `Only ${available} confirmed units available for ${input.bloodGroup}.`};
    }

    const now = new Date().toISOString();
    const resLog: ReservationLog = {
      id: `res-${Date.now()}`,
      bankId: bank.id,
      bankName: bank.name,
      bloodGroup: input.bloodGroup,
      units: input.units,
      patientName: input.patientName.trim(),
      requesterPhone: input.requesterPhone.trim(),
      timestamp: now,
    };

    setState((prev) => ({
      ...prev,
      bloodBanks: prev.bloodBanks.map((b) => {
        if (b.id !== input.bankId) return b;
        const curr = b.stock[input.bloodGroup];
        const nextConfirmed = Math.max(0, curr.confirmedUnits - input.units);
        return {
          ...b,
          lastVerifiedAt: now,
          stock: {
            ...b.stock,
            [input.bloodGroup]: {
              ...curr,
              confirmedUnits: nextConfirmed,
            },
          },
        };
      }),
      reservationLogs: [resLog, ...prev.reservationLogs],
    }));

    dispatchOwnerNotification({
      eventType: 'units_reserved',
      title: `Blood Units Reserved / Taken (${input.units} unit${input.units === 1 ? '' : 's'})`,
      actorName: input.patientName,
      actorPhone: input.requesterPhone,
      bloodGroup: input.bloodGroup,
      city: `${bank.name}, ${bank.city}`,
      details: `Reserved ${input.units} confirmed unit(s) of ${input.bloodGroup} at ${bank.name}.`,
    });

    return {ok: true};
  };

  const verifyDonor = (donorId: string) => {
    const now = new Date().toISOString();
    const verifier = currentUser?.name ?? 'Portal Admin';
    setState((prev) => ({
      ...prev,
      donors: prev.donors.map((d) =>
        d.id === donorId
          ? {
              ...d,
              verificationStatus: 'verified',
              verifiedBy: verifier,
              verifiedAt: now,
            }
          : d
      ),
    }));
  };

  const rejectDonor = (donorId: string) => {
    setState((prev) => ({
      ...prev,
      donors: prev.donors.map((d) =>
        d.id === donorId ? {...d, verificationStatus: 'rejected'} : d
      ),
    }));
  };

  const updateRequestStatus = (requestId: string, status: RequestStatus) => {
    const now = new Date().toISOString();
    const verifier = currentUser?.name ?? 'Portal Admin';
    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status,
              updatedAt: now,
              verifiedBy: status !== 'submitted' ? r.verifiedBy ?? verifier : r.verifiedBy,
            }
          : r
      ),
    }));
  };

  const verifyAndTimestampBankStock = (
    bankId: string,
    updates?: Partial<Record<BloodGroup, {confirmedUnits: number; unverifiedHoldUnits: number}>>
  ) => {
    const now = new Date().toISOString();
    const verifier = currentUser?.name ?? 'Portal Admin';
    setState((prev) => ({
      ...prev,
      bloodBanks: prev.bloodBanks.map((bank) => {
        if (bank.id !== bankId) return bank;
        const nextStock = {...bank.stock};
        if (updates) {
          (Object.keys(updates) as BloodGroup[]).forEach((group) => {
            const patch = updates[group];
            if (!patch) return;
            const confirmed = Math.max(0, patch.confirmedUnits);
            const hold = Math.max(0, patch.unverifiedHoldUnits);
            const whole = Math.max(0, Math.round(confirmed * 0.25));
            const prbc = Math.max(0, Math.round(confirmed * 0.45));
            const platelets = Math.max(0, Math.round(confirmed * 0.15));
            const ffp = Math.max(0, confirmed - whole - prbc - platelets);
            nextStock[group] = {
              confirmedUnits: confirmed,
              unverifiedHoldUnits: hold,
              components: {wholeBlood: whole, prbc, platelets, ffp},
            };
          });
        }
        return {
          ...bank,
          lastVerifiedAt: now,
          verifiedBy: verifier,
          stock: nextStock,
        };
      }),
    }));
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(DEFAULT_PERSISTED_STATE);
  };

  return (
    <PortalContext.Provider
      value={{
        ...state,
        currentPage,
        navigate,
        preselectedBloodGroup,
        setPreselectedBloodGroup,
        currentUser,
        setCoverageScope,
        setSelectedCity,
        login,
        registerAccount,
        quickDemoSignIn,
        logout,
        registerDonor,
        updateDonorAvailability,
        respondToEmergencyOffer,
        submitEmergencyRequest,
        logDonorContact,
        reserveBankUnits,
        verifyDonor,
        rejectDonor,
        updateRequestStatus,
        verifyAndTimestampBankStock,
        resetDemoData,
        emailNotifications,
        emailConfigured,
        notificationRecipient,
        lastEmailAlert,
        dismissLastEmailAlert,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used within PortalProvider');
  return ctx;
}
