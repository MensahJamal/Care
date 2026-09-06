import { useAuth } from '@/context/auth-context';
import { ALL_ROLES, AppRole, ROLE_DEFINITIONS, RoleMetadata } from '@/constants/roles';

export type Permission =
  | 'view_dashboard'
  | 'view_my_patient_record'
  | 'create_referral'
  | 'accept_reject_referral'
  | 'triage_network_queue'
  | 'manage_beds_capacity'
  | 'view_hospital_capacity'
  | 'manage_facility_staff'
  | 'manage_system_users'
  | 'access_audit_logs'
  | 'process_lab_orders'
  | 'dispense_medications';

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  patient: [
    'view_dashboard',
    'view_my_patient_record',
  ],
  pcp: [
    'view_dashboard',
    'create_referral',
    'view_hospital_capacity',
  ],
  specialist: [
    'view_dashboard',
    'accept_reject_referral',
    'view_hospital_capacity',
  ],
  referral_coordinator: [
    'view_dashboard',
    'create_referral',
    'triage_network_queue',
    'manage_beds_capacity',
    'view_hospital_capacity',
  ],
  hospital_admin: [
    'view_dashboard',
    'triage_network_queue',
    'manage_beds_capacity',
    'view_hospital_capacity',
    'manage_facility_staff',
    'access_audit_logs',
  ],
  system_admin: [
    'view_dashboard',
    'create_referral',
    'accept_reject_referral',
    'triage_network_queue',
    'manage_beds_capacity',
    'view_hospital_capacity',
    'manage_facility_staff',
    'manage_system_users',
    'access_audit_logs',
    'process_lab_orders',
    'dispense_medications',
  ],
  lab_technician: [
    'view_dashboard',
    'process_lab_orders',
    'view_hospital_capacity',
  ],
  pharmacist: [
    'view_dashboard',
    'dispense_medications',
    'view_hospital_capacity',
  ],
};

export function useRbac() {
  const { profile } = useAuth();
  const currentRole: AppRole = (profile?.role as AppRole) || 'patient';
  const roleMeta: RoleMetadata = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.patient;

  /**
   * Checks if the active user possesses one of the requested roles.
   * NOTE: By design in CareLink, `system_admin` is treated as an IT Super-User
   * and inherently returns true for all `hasRole(...)` checks.
   * If strict role isolation is needed (e.g., rendering dedicated role dashboards),
   * use `hasExactRole(role)` instead.
   */
  function hasRole(...roles: AppRole[]): boolean {
    if (!profile?.role) return false;
    // system_admin inherently has access to all clinical & administrative functions if desired
    if (profile.role === 'system_admin') return true;
    return roles.includes(profile.role as AppRole);
  }

  /**
   * Checks for an exact role match without system_admin privilege elevation.
   */
  function hasExactRole(role: AppRole): boolean {
    return profile?.role === role;
  }

  function hasPermission(permission: Permission): boolean {
    if (!profile?.role) return false;
    if (profile.role === 'system_admin') return true;
    const permissions = ROLE_PERMISSIONS[profile.role as AppRole] || [];
    return permissions.includes(permission);
  }

  return {
    role: currentRole,
    roleMeta,
    hasRole,
    hasExactRole,
    hasPermission,
    isPatient: currentRole === 'patient',
    isPcp: currentRole === 'pcp',
    isSpecialist: currentRole === 'specialist',
    isCoordinator: currentRole === 'referral_coordinator',
    isHospitalAdmin: currentRole === 'hospital_admin',
    isSystemAdmin: currentRole === 'system_admin',
    isLabTech: currentRole === 'lab_technician',
    isPharmacist: currentRole === 'pharmacist',
    allRoles: ALL_ROLES,
  };
}
