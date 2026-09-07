import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ALL_ROLES, ROLE_DEFINITIONS, type AppRole } from '../src/constants/roles.ts';

describe('RBAC & Role Definitions Test Suite', () => {
  it('defines exactly 8 distinct system roles', () => {
    assert.equal(ALL_ROLES.length, 8);
    const uniqueRoles = new Set(ALL_ROLES);
    assert.equal(uniqueRoles.size, 8);
  });

  it('contains valid definitions for all roles in ROLE_DEFINITIONS', () => {
    for (const role of ALL_ROLES) {
      const def = ROLE_DEFINITIONS[role];
      assert.ok(def, `Missing definition for role: ${role}`);
      assert.equal(def.key, role);
      assert.ok(def.title.length > 0, `Title must not be empty for role: ${role}`);
      assert.ok(def.description.length > 0, `Description must not be empty for role: ${role}`);
      assert.ok(def.badgeColor.bg.startsWith('#'), `Invalid badge bg for role: ${role}`);
      assert.ok(def.badgeColor.text.startsWith('#'), `Invalid badge text for role: ${role}`);
    }
  });

  it('enforces strict self-registration security policy', () => {
    // Only patients are allowed to self-register via the public portal
    assert.equal(ROLE_DEFINITIONS.patient.allowSelfRegistration, true);

    const privilegedRoles: AppRole[] = [
      'pcp',
      'specialist',
      'referral_coordinator',
      'hospital_admin',
      'system_admin',
      'lab_technician',
      'pharmacist',
    ];

    for (const role of privilegedRoles) {
      assert.equal(
        ROLE_DEFINITIONS[role].allowSelfRegistration,
        false,
        `Role ${role} must NOT allow self-registration (must be provisioned by admin)`,
      );
    }
  });

  it('properly categorizes clinical, administrative, diagnostic, and patient roles', () => {
    assert.equal(ROLE_DEFINITIONS.patient.category, 'patient');
    assert.equal(ROLE_DEFINITIONS.pcp.category, 'clinical');
    assert.equal(ROLE_DEFINITIONS.specialist.category, 'clinical');
    assert.equal(ROLE_DEFINITIONS.referral_coordinator.category, 'clinical');
    assert.equal(ROLE_DEFINITIONS.hospital_admin.category, 'administrative');
    assert.equal(ROLE_DEFINITIONS.system_admin.category, 'administrative');
    assert.equal(ROLE_DEFINITIONS.lab_technician.category, 'diagnostic');
    assert.equal(ROLE_DEFINITIONS.pharmacist.category, 'diagnostic');
  });

  it('validates demo credentials for all roles', () => {
    for (const role of ALL_ROLES) {
      const creds = ROLE_DEFINITIONS[role].demoCredentials;
      assert.ok(creds.email.includes('@'), `Invalid demo email for ${role}`);
      assert.ok(creds.displayName.length > 0, `Display name missing for ${role}`);
      assert.ok(creds.facilityId.length > 0, `Facility ID missing for ${role}`);
      assert.ok(creds.facilityName.length > 0, `Facility name missing for ${role}`);
      assert.ok(creds.phone.length >= 8, `Phone number invalid for ${role}`);
    }
  });

  describe('Referral System RBAC Permissions', () => {
    it('restricts referral operations exclusively to hospital_admin, specialist, and system_admin', async () => {
      const { canAccessReferrals, REFERRAL_AUTHORIZED_ROLES } = await import(
        '../src/constants/roles.ts'
      );

      assert.deepEqual(REFERRAL_AUTHORIZED_ROLES, [
        'hospital_admin',
        'specialist',
        'system_admin',
      ]);

      // Authorized roles
      assert.strictEqual(canAccessReferrals('specialist'), true);
      assert.strictEqual(canAccessReferrals('hospital_admin'), true);
      assert.strictEqual(canAccessReferrals('system_admin'), true);

      // Unauthorized roles
      assert.strictEqual(canAccessReferrals('patient'), false);
      assert.strictEqual(canAccessReferrals('pcp'), false);
      assert.strictEqual(canAccessReferrals('referral_coordinator'), false);
      assert.strictEqual(canAccessReferrals('lab_technician'), false);
      assert.strictEqual(canAccessReferrals('pharmacist'), false);
      assert.strictEqual(canAccessReferrals(null), false);
      assert.strictEqual(canAccessReferrals(undefined), false);
    });

    it('identifies system_admin as having nationwide network oversight', async () => {
      const { isSystemAdminRole } = await import('../src/constants/roles.ts');

      assert.strictEqual(isSystemAdminRole('system_admin'), true);
      assert.strictEqual(isSystemAdminRole('hospital_admin'), false);
      assert.strictEqual(isSystemAdminRole('specialist'), false);
      assert.strictEqual(isSystemAdminRole('patient'), false);
      assert.strictEqual(isSystemAdminRole('pcp'), false);
    });
  });
});
