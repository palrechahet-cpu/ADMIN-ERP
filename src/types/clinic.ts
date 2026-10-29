export type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected' | 'no-show';

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Pending' | 'Overdue' | 'Refunded';

export type Modality = 'In-person' | 'Online' | 'In-Person' | 'Telehealth';

export function formatModality(m: string | undefined): 'In-person' | 'Online' {
  if (!m) return 'In-person';
  const lower = m.toLowerCase();
  if (lower.includes('online') || lower.includes('telehealth') || lower.includes('video')) {
    return 'Online';
  }
  return 'In-person';
}

export interface Consultant {
  id: string;
  name: string;
  title: string;
  credentials: string; // e.g., 'PsyD', 'LCSW', 'LMFT', 'MD Psychiatrist', 'LPC'
  email: string;
  phone: string;
  room?: string;
  colorHex: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  accentBg: string;
  accentText: string;
  specialties: string[];
  hourlyRate: number;
  activeCaseload: number;
  maxCaseload: number;
  availabilityDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  bio: string;
  acceptingNewClients: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  intakeDate: string;
  assignedConsultantId: string;
  status: 'Active' | 'Intake Pending' | 'On Leave' | 'Discharged';
  primaryConcern: string;
  diagnosticCode?: string;
  insuranceProvider?: string;
  copayAmount?: number;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  notes?: string;
  totalSessionsAttended: number;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  consultantId: string;
  consultantName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24-hr format e.g. "09:00", "14:30")
  durationMinutes: number;
  modality: Modality;
  locationDetails?: string; // In-person or Online Video
  sessionType: string;
  status: SessionStatus;
  rejectionReason?: string;
  fee: number;
  paymentStatus: PaymentStatus;
  cptCode?: string;
  clinicalNotes?: string;
  coordinatorNotes?: string;
  createdAt: string;
  requestedByClient?: boolean;
}

export interface PaymentRecord {
  id: string;
  invoiceNumber: string;
  appointmentId: string;
  clientId: string;
  clientName: string;
  consultantName: string;
  date: string;
  amount: number;
  method: 'Credit Card' | 'HSA/FSA Card' | 'Insurance Co-Pay' | 'ACH Transfer' | 'Cash';
  status: PaymentStatus;
  notes?: string;
  paidAt?: string;
  cptCode?: string;
}

export type ViewTab = 'calendar' | 'requests' | 'appointments' | 'clients' | 'consultants' | 'settings';

export interface WorkspaceFeatures {
  requestsTriage: boolean;        // Intake Requests & Triage approval queue
  consultantsCaseload: boolean;   // Staff directory & caseload tracking
  googleCalendarSync: boolean;    // Google Calendar sync integration
  paymentsLedger?: boolean;       // Optional billing (hidden by default)
}

export type WorkspaceRole = 'creator' | 'member';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  creatorUid: string;
  creatorEmail: string;
  creatorName: string;
  accessCode: string;             // e.g. "MW-8492"
  authorizedEmails: string[];     // emails pre-authorized by the creator
  enabledFeatures: WorkspaceFeatures;
  practiceType: 'solo' | 'group' | 'clinic' | 'coaching';
  
  // User-defined organization parameters
  practiceCategory: string;       // e.g. 'Psychology & Psychotherapy', 'Psychiatry & Medical', etc.
  servicesOffered: string[];      // e.g. ['Individual Psychotherapy', 'Couples Therapy', ...]
  providerLabel: string;          // e.g. 'Psychologists', 'Therapists', 'Counselors', 'Clinicians'
  providerLabelSingular: string;  // e.g. 'Psychologist', 'Therapist', 'Counselor', 'Clinician'
  clientLabel: string;            // 'Clients' or 'Patients'
  clientLabelSingular: string;    // 'Client' or 'Patient'
  specialtyTags: string[];        // User-decided focus tags
  
  clientCapacity: number;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export function getProviderLabel(workspace?: Workspace | null, plural = true): string {
  if (!workspace?.providerLabel) return plural ? 'Clinicians' : 'Clinician';
  return plural ? workspace.providerLabel : (workspace.providerLabelSingular || workspace.providerLabel.replace(/s$/, ''));
}

export function getClientLabel(workspace?: Workspace | null, plural = true): string {
  if (!workspace?.clientLabel) return plural ? 'Clients' : 'Client';
  return plural ? workspace.clientLabel : (workspace.clientLabelSingular || workspace.clientLabel.replace(/s$/, ''));
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Client Messaging Purpose Types
export type ClientMessagePurpose = 
  | 'confirmation' 
  | 'reminder' 
  | 'reschedule' 
  | 'running_late' 
  | 'follow_up' 
  | 'intake_welcome'
  | 'general_inquiry'
  | 'custom';

export interface MessagePurposeOption {
  id: ClientMessagePurpose;
  title: string;
  badge: string;
  description: string;
}

export const MESSAGE_PURPOSES: MessagePurposeOption[] = [
  {
    id: 'confirmation',
    title: 'Appointment confirmation',
    badge: 'Confirmed',
    description: 'Confirm upcoming scheduled appointment details, clinician, and modality'
  },
  {
    id: 'reschedule',
    title: 'Rescheduling',
    badge: 'Schedule',
    description: 'Coordinate an alternative appointment date or time'
  },
  {
    id: 'intake_welcome',
    title: 'Intake follow-up',
    badge: 'Intake',
    description: 'Follow-up on onboarding forms, initial intake, and care preferences'
  },
  {
    id: 'general_inquiry',
    title: 'General inquiry',
    badge: 'Inquiry',
    description: 'Standard practice check-in and open clinical support channel'
  },
  {
    id: 'reminder',
    title: 'Session Reminder',
    badge: 'Reminder',
    description: 'Friendly reminder 24 hours or day-of session'
  },
  {
    id: 'running_late',
    title: 'Running 5-10m Late',
    badge: 'Notice',
    description: 'Notify client of a brief clinician schedule delay'
  },
  {
    id: 'follow_up',
    title: 'Session Follow-up & Check-in',
    badge: 'Care',
    description: 'Post-session well-being check and between-session support'
  },
  {
    id: 'custom',
    title: 'Custom Message',
    badge: 'Direct',
    description: 'Compose custom text directly to the client'
  }
];
