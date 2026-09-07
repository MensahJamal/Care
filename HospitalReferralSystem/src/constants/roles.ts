import type { SymbolViewProps } from 'expo-symbols';

export type AppRole =
  | 'patient'
  | 'pcp'
  | 'specialist'
  | 'referral_coordinator'
  | 'hospital_admin'
  | 'system_admin'
  | 'lab_technician'
  | 'pharmacist';

export interface RoleMetadata {
  key: AppRole;
  title: string;
  shortTitle: string;
  category: 'clinical' | 'administrative' | 'diagnostic' | 'patient';
  description: string;
  icon: {
    ios: SymbolViewProps['name'] extends infer T ? (T extends string ? T : never) : never;
    android: Exclude<SymbolViewProps['name'], string> extends { android?: infer T } ? T : never;
  };
  badgeColor: {
    bg: string;
    text: string;
    border: string;
  };
  demoCredentials: {
    email: string;
    displayName: string;
    jobTitle: string;
    facilityName: string;
    facilityId: string;
    phone: string;
  };
  allowSelfRegistration: boolean;
}

export const ROLE_DEFINITIONS: Record<AppRole, RoleMetadata> = {
  patient: {
    key: 'patient',
    title: 'Patient Portal',
    shortTitle: 'Patient',
    category: 'patient',
    description: 'Track referral status, view upcoming appointments, lab results and prescriptions.',
    icon: { ios: 'person.fill', android: 'person' },
    badgeColor: {
      bg: '#EAF2FB',
      text: '#2563A8',
      border: '#BCD7F5',
    },
    demoCredentials: {
      email: 'patient@carelink.local',
      displayName: 'Ama Serwaa Owusu',
      jobTitle: 'Registered Patient',
      facilityName: 'Korle Bu Teaching Hospital',
      facilityId: 'KBTH-01',
      phone: '+233 24 555 0191',
    },
    allowSelfRegistration: true,
  },
  pcp: {
    key: 'pcp',
    title: 'Primary Care Physician (PCP)',
    shortTitle: 'PCP Doctor',
    category: 'clinical',
    description: 'Initiate patient transfers, search network capacity, and consult with specialists.',
    icon: { ios: 'stethoscope', android: 'medical_services' },
    badgeColor: {
      bg: '#E5F4EF',
      text: '#0B6B58',
      border: '#A5DEC9',
    },
    demoCredentials: {
      email: 'pcp@carelink.local',
      displayName: 'Dr. Kwame Addo',
      jobTitle: 'Primary Care Physician / SMO',
      facilityName: 'Ridge Hospital PolyClinic',
      facilityId: 'RDG-02',
      phone: '+233 24 555 0199',
    },
    allowSelfRegistration: false,
  },
  specialist: {
    key: 'specialist',
    title: 'Specialist / Receiving Doctor',
    shortTitle: 'Specialist',
    category: 'clinical',
    description: 'Triage incoming referrals, review diagnostics, accept or decline transfers, manage on-call status.',
    icon: { ios: 'heart.text.square.fill', android: 'local_hospital' },
    badgeColor: {
      bg: '#F3E8FF',
      text: '#7E22CE',
      border: '#D8B4FE',
    },
    demoCredentials: {
      email: 'specialist@carelink.local',
      displayName: 'Dr. Naa Lartey',
      jobTitle: 'Senior Consultant Cardiologist',
      facilityName: 'Korle Bu Teaching Hospital',
      facilityId: 'KBTH-01',
      phone: '+233 24 555 0244',
    },
    allowSelfRegistration: false,
  },
  referral_coordinator: {
    key: 'referral_coordinator',
    title: 'Referral Coordinator / Intake Staff',
    shortTitle: 'Intake Staff',
    category: 'clinical',
    description: 'Manage inter-hospital queue, coordinate emergency transport, track beds and dispatch triage.',
    icon: { ios: 'arrow.left.arrow.right', android: 'swap_horiz' },
    badgeColor: {
      bg: '#FFF3DD',
      text: '#D97706',
      border: '#FDE2A7',
    },
    demoCredentials: {
      email: 'coordinator@carelink.local',
      displayName: 'Kofi Manu',
      jobTitle: 'Senior Referral & Intake Coordinator',
      facilityName: 'Korle Bu Central Triage',
      facilityId: 'KBTH-01',
      phone: '+233 24 555 0155',
    },
    allowSelfRegistration: false,
  },
  hospital_admin: {
    key: 'hospital_admin',
    title: 'Hospital Administrator',
    shortTitle: 'Hospital Admin',
    category: 'administrative',
    description: 'Manage facility capacity, bed occupancy, department rosters, staff credentials and transfer SLAs.',
    icon: { ios: 'building.2.fill', android: 'domain' },
    badgeColor: {
      bg: '#E0F2FE',
      text: '#0284C7',
      border: '#BAE6FD',
    },
    demoCredentials: {
      email: 'hospadmin@carelink.local',
      displayName: 'Administrator Mensah',
      jobTitle: 'Director of Clinical Operations',
      facilityName: 'Korle Bu Teaching Hospital',
      facilityId: 'KBTH-01',
      phone: '+233 24 555 0100',
    },
    allowSelfRegistration: false,
  },
  system_admin: {
    key: 'system_admin',
    title: 'System Administrator (IT Super Admin)',
    shortTitle: 'System Admin',
    category: 'administrative',
    description: 'Network-wide tenant governance, role provisioning, security audit logs, and integration health.',
    icon: { ios: 'shield.lefthalf.filled', android: 'admin_panel_settings' },
    badgeColor: {
      bg: '#FDECEA',
      text: '#C2413A',
      border: '#F8B4AF',
    },
    demoCredentials: {
      email: 'sysadmin@carelink.local',
      displayName: 'Emmanuel Asare',
      jobTitle: 'National Health IT Director',
      facilityName: 'National Referral Health Exchange',
      facilityId: 'HQ-SYS-001',
      phone: '+233 20 555 9900',
    },
    allowSelfRegistration: false,
  },
  lab_technician: {
    key: 'lab_technician',
    title: 'Lab Technician',
    shortTitle: 'Lab Tech',
    category: 'diagnostic',
    description: 'Process incoming transfer diagnostic requisitions, upload pathology & scan findings, report critical values.',
    icon: { ios: 'cross.vial.fill', android: 'science' },
    badgeColor: {
      bg: '#ECFDF5',
      text: '#059669',
      border: '#A7F3D0',
    },
    demoCredentials: {
      email: 'lab@carelink.local',
      displayName: 'Akosua Darko',
      jobTitle: 'Lead Medical Laboratory Scientist',
      facilityName: 'Korle Bu Pathology & Diagnostics',
      facilityId: 'KBTH-01',
      phone: '+233 24 555 0331',
    },
    allowSelfRegistration: false,
  },
  pharmacist: {
    key: 'pharmacist',
    title: 'Pharmacist',
    shortTitle: 'Pharmacist',
    category: 'diagnostic',
    description: 'Reconcile patient medication upon transfer, verify high-alert drug orders, manage emergency formulary stocks.',
    icon: { ios: 'pills.fill', android: 'medication' },
    badgeColor: {
      bg: '#FEF3C7',
      text: '#B45309',
      border: '#FCD34D',
    },
    demoCredentials: {
      email: 'pharmacy@carelink.local',
      displayName: 'Pharm. David Osei',
      jobTitle: 'Clinical Specialist Pharmacist',
      facilityName: 'Korle Bu Central Pharmacy',
      facilityId: 'KBTH-01',
      phone: '+233 24 555 0412',
    },
    allowSelfRegistration: false,
  },
};

export const ALL_ROLES: AppRole[] = [
  'patient',
  'pcp',
  'specialist',
  'referral_coordinator',
  'hospital_admin',
  'system_admin',
  'lab_technician',
  'pharmacist',
];

/**
 * Only Hospital Administrators and Specialists are authorized to create,
 * scan, accept, or reject patient referrals.
 * System Administrators oversee the full nationwide network.
 */
export const REFERRAL_AUTHORIZED_ROLES: AppRole[] = [
  'hospital_admin',
  'specialist',
  'system_admin',
];

export function canAccessReferrals(role?: AppRole | string | null): boolean {
  if (!role) return false;
  return REFERRAL_AUTHORIZED_ROLES.includes(role as AppRole);
}

export function isSystemAdminRole(role?: AppRole | string | null): boolean {
  return role === 'system_admin';
}

