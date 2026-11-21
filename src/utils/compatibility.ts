import {BloodGroup, EmergencyRequest} from '../types/bloodconnect.ts';

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * Given a recipient blood group, returns donor blood groups clinically compatible for RBC transfusion.
 */
const COMPATIBLE_DONORS_MAP: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
};

export function getCompatibleDonorGroups(recipientGroup: BloodGroup): BloodGroup[] {
  return COMPATIBLE_DONORS_MAP[recipientGroup];
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatTimeAgo(isoTimestamp: string, nowMs = Date.now()): string {
  const diffMs = Math.max(0, nowMs - new Date(isoTimestamp).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatExactTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getStockFreshness(isoTimestamp: string, nowMs = Date.now()): 'fresh' | 'aging' | 'stale' {
  const hours = (nowMs - new Date(isoTimestamp).getTime()) / (1000 * 60 * 60);
  if (hours <= 4) return 'fresh';
  if (hours <= 12) return 'aging';
  return 'stale';
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

export function detectPotentialDuplicateRequest(
  candidate: {
    contactPhone: string;
    hospitalName: string;
    bloodGroup: BloodGroup;
    city: string;
  },
  existingRequests: EmergencyRequest[]
): EmergencyRequest | undefined {
  const cleanPhone = normalizePhone(candidate.contactPhone);
  const cleanHospital = candidate.hospitalName.trim().toLowerCase();

  return existingRequests.find((req) => {
    if (req.status === 'fulfilled' || req.status === 'flagged_duplicate') return false;
    const samePhone = cleanPhone.length >= 8 && normalizePhone(req.contactPhone) === cleanPhone;
    const sameBlood = req.bloodGroup === candidate.bloodGroup;
    const sameCity = req.city.toLowerCase() === candidate.city.toLowerCase();
    const similarHospital =
      cleanHospital.length > 3 &&
      (req.hospitalName.toLowerCase().includes(cleanHospital) ||
        cleanHospital.includes(req.hospitalName.toLowerCase()));

    return (samePhone && sameBlood) || (sameCity && similarHospital && sameBlood);
  });
}
