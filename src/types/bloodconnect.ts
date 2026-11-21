export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type BloodComponent = 'Whole Blood' | 'Packed Red Cells (PRBC)' | 'Platelets (RDP/SDP)' | 'Fresh Frozen Plasma (FFP)';

export type CoverageScope = 'all_india' | 'karnataka' | 'city';

export type VerificationStatus = 'verified' | 'pending_review' | 'rejected';

export type DonorAvailability = 'available' | 'unavailable' | 'recently_donated';

export type RequestUrgency = 'critical' | 'urgent' | 'scheduled';

export type RequestStatus = 'submitted' | 'verified' | 'donors_notified' | 'fulfilled' | 'flagged_duplicate';

export type UserRole = 'requester' | 'donor' | 'admin';

export type PageId =
  | 'home'
  | 'find-donors'
  | 'become-donor'
  | 'emergency-request'
  | 'blood-availability'
  | 'blood-banks'
  | 'auth'
  | 'admin';

export interface CityMeta {
  name: string;
  state: string;
  lat: number;
  lng: number;
  inKarnataka: boolean;
}

export interface Donor {
  id: string;
  name: string;
  phone: string;
  email: string;
  bloodGroup: BloodGroup;
  state: string;
  city: string;
  locality: string;
  lat: number;
  lng: number;
  availability: DonorAvailability;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  registeredAt: string;
  lastAvailabilityUpdatedAt: string;
  lastDonationDate?: string;
  donationCount: number;
  age: number;
  weightKg: number;
}

export interface BloodUnitStock {
  confirmedUnits: number;
  unverifiedHoldUnits: number;
  components: {
    wholeBlood: number;
    prbc: number;
    platelets: number;
    ffp: number;
  };
}

export interface BloodBank {
  id: string;
  name: string;
  licenseNumber: string;
  type: 'Government' | 'Charitable Trust' | 'Hospital Blood Centre';
  state: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  is24x7: boolean;
  lastVerifiedAt: string;
  verifiedBy: string;
  stock: Record<BloodGroup, BloodUnitStock>;
}

export interface EmergencyRequest {
  id: string;
  patientName: string;
  hospitalName: string;
  state: string;
  city: string;
  locality: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  unitsNeeded: number;
  urgency: RequestUrgency;
  contactName: string;
  contactPhone: string;
  notes: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  verifiedBy?: string;
  duplicateOfId?: string;
  matchedDonorIds: string[];
  declinedDonorIds: string[];
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  city: string;
  state: string;
  phone: string;
  donorId?: string;
}

export interface ContactLog {
  id: string;
  donorId: string;
  donorName: string;
  requesterName: string;
  requesterPhone: string;
  hospitalName: string;
  bloodGroup: BloodGroup;
  timestamp: string;
}

export interface ReservationLog {
  id: string;
  bankId: string;
  bankName: string;
  bloodGroup: BloodGroup;
  units: number;
  patientName: string;
  requesterPhone: string;
  timestamp: string;
}

export type EmailNotificationEventType =
  | 'account_registered'
  | 'donor_registered'
  | 'blood_donated'
  | 'blood_requested'
  | 'units_reserved'
  | 'donor_contacted';

export interface EmailNotificationRecord {
  id: string;
  eventType: EmailNotificationEventType;
  recipient: string;
  subject: string;
  actorName: string;
  actorPhone: string;
  actorEmail: string;
  bloodGroup: string;
  city: string;
  details: string;
  status: 'sent' | 'logged_awaiting_smtp' | 'failed';
  provider: 'smtp' | 'resend' | 'local_log';
  errorReason?: string;
  timestamp: string;
}

