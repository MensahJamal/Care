import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { Screen } from '@/components/ui/screen';
import { Colors, Spacing } from '@/constants/theme';
import { ALL_ROLES, AppRole, ROLE_DEFINITIONS } from '@/constants/roles';
import { DEMO_PROFILES, useAuth } from '@/context/auth-context';
import { useRbac } from '@/hooks/use-rbac';
import { RoleSwitcherBanner } from '@/components/dashboards/role-switcher-banner';
import { subscribeToUsers, callProvisionStaffUser } from '@/lib/firestore';

function getDynamicDemoTeam() {
  const staffRoles: AppRole[] = [
    'specialist',
    'pcp',
    'referral_coordinator',
    'lab_technician',
    'pharmacist',
    'hospital_admin',
  ];
  return staffRoles.map((roleKey) => {
    const prof = DEMO_PROFILES[roleKey];
    const meta = ROLE_DEFINITIONS[roleKey] || ROLE_DEFINITIONS.pcp;
    const name = prof?.displayName || meta.demoCredentials.displayName;
    const role = prof?.jobTitle || meta.demoCredentials.jobTitle;
    const initials = name
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return {
      initials,
      name,
      role,
      access: meta.shortTitle,
    };
  });
}

export default function AccountScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const compact = width < 540;
  const { profile, signOutUser, editProfile, isFirebaseMode } = useAuth();
  const { roleMeta, isHospitalAdmin, isSystemAdmin } = useRbac();
  const [editor, setEditor] = useState<'profile' | 'facility' | 'contact' | 'notifications' | 'security' | null>(null);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [teamList, setTeamList] = useState(getDynamicDemoTeam);

  const canManageTeam = isHospitalAdmin || isSystemAdmin;
  const displayName = profile?.displayName || 'Clinical User';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!isFirebaseMode) return;
    const unsub = subscribeToUsers(
      isSystemAdmin ? undefined : profile?.facilityId,
      (users) => {
        if (users && users.length > 0) {
          const mapped = users.map((u) => {
            const role = (u.role as AppRole) || 'pcp';
            const meta = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.pcp;
            const name = u.displayName || 'Staff Member';
            const memberInitials = name
              .split(' ')
              .map((part: string) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return {
              initials: memberInitials,
              name,
              role: u.jobTitle || meta.title,
              access: meta.shortTitle,
            };
          });
          setTeamList(mapped);
        }
      },
      (err) => console.error('Failed to subscribe to live team directory:', err),
    );
    return () => unsub?.();
  }, [isFirebaseMode, isSystemAdmin, profile?.facilityId]);

  return (
    <Screen title="Account & Identity" subtitle="Manage your profile, verified role credentials and clinical access">
      <RoleSwitcherBanner />

      <View style={[styles.profile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.profileInitials}>{initials}</Text>
        </View>
        <View style={styles.profileMain}>
          <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.profileRole, { color: colors.textSecondary }]}>
            {profile?.jobTitle} · {roleMeta.title}
          </Text>
          <View
            style={[
              styles.verified,
              {
                backgroundColor: roleMeta.badgeColor.bg,
                borderColor: roleMeta.badgeColor.border,
              },
            ]}>
            <AppIcon
              ios={roleMeta.icon.ios}
              android={roleMeta.icon.android}
              color={roleMeta.badgeColor.text}
              size={13}
            />
            <Text style={[styles.verifiedText, { color: roleMeta.badgeColor.text }]}>
              Verified {roleMeta.shortTitle} Role
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => setEditor('profile')}
          style={({ pressed }) => [
            styles.editButton,
            { borderColor: colors.border },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.editText, { color: colors.text }]}>Edit profile</Text>
        </Pressable>
      </View>

      <View style={styles.settingsGrid}>
        <SettingCard
          onPress={() => setEditor('facility')}
          compact={compact}
          icon={{ ios: 'building.2', android: 'medical_services' }}
          title="Facility profile"
          description={profile?.facilityName ?? 'Assigned facility'}
          detail={
            profile?.facilityId
              ? `${profile.facilityId} · Admin: ${DEMO_PROFILES.hospital_admin?.displayName || 'Administrator Mensah'}`
              : 'Facility not assigned'
          }
        />
        <SettingCard
          onPress={() => setEditor('contact')}
          compact={compact}
          icon={{ ios: 'envelope', android: 'mail' }}
          title="Referral contact"
          description={profile?.email ?? 'No email address'}
          detail={profile?.phone ?? 'No phone number'}
        />
        <SettingCard
          onPress={() => setEditor('notifications')}
          compact={compact}
          icon={{ ios: 'bell', android: 'notifications' }}
          title="Notifications"
          description={profile?.notificationsEnabled ? 'Emergency referrals' : 'Notifications paused'}
          detail={profile?.notificationsEnabled ? 'Instant alert routing active' : 'Notifications disabled'}
        />
        <SettingCard
          onPress={() => setEditor('security')}
          compact={compact}
          icon={{ ios: 'lock.shield', android: 'shield_person' }}
          title="Security & RBAC"
          description={profile?.twoStepEnabled ? 'Two-step verification' : 'Standard MFA'}
          detail={`Role: ${roleMeta.shortTitle} · Strict Enforcement`}
        />
      </View>

      {/* Multi-Disciplinary Care Team Roster */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Network Staff & RBAC Directory</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {canManageTeam
                ? 'Administrators can provision and reassign RBAC staff permissions'
                : 'Staff access is strictly governed by your hospital and IT system administrator'}
            </Text>
          </View>
          {canManageTeam ? (
            <Pressable
              accessibilityLabel="Provision new staff member"
              onPress={() => setProvisionOpen(true)}
              style={({ pressed }) => [
                styles.inviteButton,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}>
              <AppIcon ios="person.badge.plus" android="group" color={colors.white} size={16} />
              <Text style={styles.inviteText}>Provision Staff</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.teamList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {teamList.map((member, index) => (
            <View
              key={`${member.name}-${index}`}
              style={[
                styles.teamRow,
                index < teamList.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}>
              <View style={[styles.teamAvatar, { backgroundColor: colors.infoSoft }]}>
                <Text style={[styles.teamInitials, { color: colors.info }]}>{member.initials}</Text>
              </View>
              <View style={styles.teamMain}>
                <Text style={[styles.teamName, { color: colors.text }]}>{member.name}</Text>
                <Text style={[styles.teamRole, { color: colors.textSecondary }]}>{member.role}</Text>
              </View>
              <View
                style={[
                  styles.accessBadge,
                  {
                    backgroundColor: colors.primarySoft,
                  },
                ]}>
                <Text
                  style={[
                    styles.accessText,
                    {
                      color: colors.primary,
                    },
                  ]}>
                  {member.access}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        onPress={signOutUser}
        style={({ pressed }) => [styles.signOut, { borderColor: colors.border }, pressed && styles.pressed]}>
        <Text style={[styles.signOutText, { color: colors.danger }]}>Sign Out of {roleMeta.shortTitle} Session</Text>
      </Pressable>

      <View style={[styles.audit, { backgroundColor: colors.infoSoft }]}>
        <AppIcon ios="doc.text.magnifyingglass" android="search" color={colors.info} size={20} />
        <View style={styles.auditMain}>
          <Text style={[styles.auditTitle, { color: colors.text }]}>RBAC Security & Compliance Audit Trail</Text>
          <Text style={[styles.auditText, { color: colors.textSecondary }]}>
            All access tokens, triage decisions, and role handoffs are cryptographically logged for clinical governance.
          </Text>
        </View>
      </View>

      {editor && (
        <AccountEditor
          key={editor}
          section={editor}
          profile={profile}
          canManageFacility={canManageTeam}
          onClose={() => setEditor(null)}
          onSave={async (updates) => {
            await editProfile(updates);
            if (!isFirebaseMode) {
              setTeamList(getDynamicDemoTeam());
            }
            setEditor(null);
          }}
        />
      )}

      <ProvisionStaffModal
        visible={provisionOpen}
        onClose={() => setProvisionOpen(false)}
        facilityId={profile?.facilityId || 'KBTH-01'}
        facilityName={profile?.facilityName || 'Korle Bu Teaching Hospital'}
        isSysAdmin={isSystemAdmin}
        onProvisioned={(newMember) => {
          setTeamList((prev) => [newMember, ...prev]);
        }}
      />
    </Screen>
  );
}

function SettingCard({
  icon,
  title,
  description,
  detail,
  compact,
  onPress,
}: {
  icon: { ios: Parameters<typeof AppIcon>[0]['ios']; android: Parameters<typeof AppIcon>[0]['android'] };
  title: string;
  description: string;
  detail: string;
  compact: boolean;
  onPress: () => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingCard,
        compact && styles.settingCardCompact,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.settingIcon, { backgroundColor: colors.backgroundElement }]}>
        <AppIcon ios={icon.ios} android={icon.android} color={colors.primary} size={20} />
      </View>
      <View style={styles.settingMain}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{description}</Text>
        <Text style={[styles.settingDetail, { color: colors.textSecondary }]}>{detail}</Text>
      </View>
      <AppIcon ios="chevron.right" android="arrow_forward" color={colors.textSecondary} size={16} />
    </Pressable>
  );
}

function AccountEditor({
  section,
  profile,
  canManageFacility,
  onClose,
  onSave,
}: {
  section: 'profile' | 'facility' | 'contact' | 'notifications' | 'security' | null;
  profile: ReturnType<typeof useAuth>['profile'];
  canManageFacility: boolean;
  onClose: () => void;
  onSave: (updates: Partial<NonNullable<ReturnType<typeof useAuth>['profile']>>) => Promise<void>;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [jobTitle, setJobTitle] = useState(profile?.jobTitle ?? '');
  const [facilityName, setFacilityName] = useState(profile?.facilityName ?? '');
  const [facilityId, setFacilityId] = useState(profile?.facilityId ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notificationsEnabled ?? true);
  const [twoStepEnabled, setTwoStepEnabled] = useState(profile?.twoStepEnabled ?? false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!section || !profile) return null;

  const titles = {
    profile: 'Edit Profile Information',
    facility: 'Edit Facility Assignment',
    contact: 'Edit Referral Contact',
    notifications: 'Edit Notification Rules',
    security: 'Edit Security Settings',
  };

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      if (section === 'profile') {
        const cleanName = displayName.trim();
        if (!cleanName || cleanName.length < 2) {
          setSaveError('Please enter a valid full name (minimum 2 characters).');
          setSaving(false);
          return;
        }
        if (cleanName.length > 60) {
          setSaveError('Full name must not exceed 60 characters.');
          setSaving(false);
          return;
        }
      }

      const updates =
        section === 'profile'
          ? { displayName: displayName.trim(), jobTitle: jobTitle.trim() }
          : section === 'facility' && canManageFacility
            ? { facilityName, facilityId }
            : section === 'contact'
              ? { phone }
              : section === 'notifications'
                ? { notificationsEnabled }
                : { twoStepEnabled };
      await onSave(updates);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.editorModal, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{titles[section]}</Text>
            <Pressable
              accessibilityLabel="Close editor"
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.backgroundElement }]}>
              <AppIcon ios="xmark" android="close" color={colors.text} size={17} />
            </Pressable>
          </View>

          {saveError ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerSoft }]}>
              <AppIcon ios="exclamationmark.circle.fill" android="error" color={colors.danger} size={16} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{saveError}</Text>
            </View>
          ) : null}

          {section === 'profile' ? (
            <>
              <EditorField
                label="Full name / Display name"
                value={displayName}
                onChangeText={setDisplayName}
                colors={colors}
              />
              <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>
                This name is visible to clinical colleagues, triage coordinators, and administrators across your facility.
              </Text>
              <EditorField label="Job title" value={jobTitle} onChangeText={setJobTitle} colors={colors} />
            </>
          ) : null}
          {section === 'facility' ? (
            canManageFacility ? (
              <>
                <EditorField label="Facility name" value={facilityName} onChangeText={setFacilityName} colors={colors} />
                <EditorField label="Facility ID" value={facilityId} onChangeText={setFacilityId} colors={colors} />
              </>
            ) : (
              <View style={[styles.lockedNotice, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <AppIcon ios="lock.shield.fill" android="security" color={colors.primary} size={20} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.lockedNoticeTitle, { color: colors.text }]}>Facility Governance & Administrator</Text>
                  <Text style={[styles.lockedNoticeDesc, { color: colors.textSecondary }]}>
                    Hospital Administrator: {DEMO_PROFILES.hospital_admin?.displayName || 'Administrator Mensah'} ({DEMO_PROFILES.hospital_admin?.jobTitle || 'Director of Clinical Operations'})
                  </Text>
                  <Text style={[styles.lockedNoticeDesc, { color: colors.textSecondary }]}>
                    Hospital facility assignment is cryptographically linked to your account node ({profile.facilityId}). Facility transfers must be executed by your Hospital Administrator or Super Admin.
                  </Text>
                </View>
              </View>
            )
          ) : null}
          {section === 'contact' ? (
            <EditorField label="Phone number" value={phone} onChangeText={setPhone} colors={colors} />
          ) : null}
          {section === 'notifications' ? (
            <EditorSwitch
              label="Emergency referral notifications"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              colors={colors}
            />
          ) : null}
          {section === 'security' ? (
            <EditorSwitch
              label="Two-step verification"
              value={twoStepEnabled}
              onValueChange={setTwoStepEnabled}
              colors={colors}
            />
          ) : null}

          <View style={styles.editorActions}>
            <Pressable onPress={onClose} style={[styles.cancelButton, { borderColor: colors.border }]}>
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={saving}
              onPress={save}
              style={[styles.saveButton, { backgroundColor: colors.primary }, saving && styles.pressed]}>
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save changes'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EditorField({
  label,
  value,
  onChangeText,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: (typeof Colors)[keyof typeof Colors];
}) {
  return (
    <View style={styles.editorField}>
      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[
          styles.editorInput,
          { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
        ]}
      />
    </View>
  );
}

function EditorSwitch({
  label,
  value,
  onValueChange,
  colors,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: (typeof Colors)[keyof typeof Colors];
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={[styles.switchLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primarySoft }}
        thumbColor={value ? colors.primary : colors.textSecondary}
      />
    </View>
  );
}

function ProvisionStaffModal({
  visible,
  onClose,
  facilityId,
  facilityName,
  isSysAdmin,
  onProvisioned,
}: {
  visible: boolean;
  onClose: () => void;
  facilityId: string;
  facilityName: string;
  isSysAdmin: boolean;
  onProvisioned: (member: { initials: string; name: string; role: string; access: string }) => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { registerProvisionedAccount } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<AppRole>('specialist');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  const availableRoles: AppRole[] = isSysAdmin
    ? ALL_ROLES.filter((r) => r !== 'patient')
    : ALL_ROLES.filter((r) => r !== 'patient' && r !== 'system_admin');

  function resetForm() {
    setFullName('');
    setEmail('');
    setJobTitle('');
    setRole('specialist');
    setError(null);
    setCreatedPassword(null);
  }

  async function handleProvision() {
    if (!fullName.trim() || !email.trim()) {
      setError('Please provide a full name and email address.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    const defaultJob = jobTitle.trim() || ROLE_DEFINITIONS[role].title;
    const initialTempPassword = `CareAuth#${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const result = await callProvisionStaffUser({
        email: cleanEmail,
        password: initialTempPassword,
        displayName: fullName.trim(),
        role,
        jobTitle: defaultJob,
        facilityId,
        facilityName,
      });

      const finalPassword = result.tempPassword || initialTempPassword;

      registerProvisionedAccount(
        {
          uid: result.uid || `prov-${Date.now()}`,
          displayName: fullName.trim(),
          email: cleanEmail,
          role,
          jobTitle: defaultJob,
          facilityName,
          facilityId,
          phone: '',
          notificationsEnabled: true,
          twoStepEnabled: role === 'hospital_admin' || role === 'system_admin',
        },
        finalPassword,
      );

      const initials = fullName
        .trim()
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      onProvisioned({
        initials,
        name: fullName.trim(),
        role: defaultJob,
        access: ROLE_DEFINITIONS[role].shortTitle,
      });

      setCreatedPassword(finalPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Provisioning failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.editorModal, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppIcon ios="person.badge.plus" android="group" color={colors.primary} size={20} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Provision Staff Account</Text>
            </View>
            <Pressable
              accessibilityLabel="Close provision modal"
              onPress={() => {
                resetForm();
                onClose();
              }}
              style={[styles.closeButton, { backgroundColor: colors.backgroundElement }]}>
              <AppIcon ios="xmark" android="close" color={colors.text} size={16} />
            </Pressable>
          </View>

          {createdPassword ? (
            <View style={{ gap: 16 }}>
              <View style={[styles.successSlip, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
                <AppIcon ios="checkmark.seal.fill" android="verified" color={colors.primary} size={28} />
                <Text style={[styles.successSlipTitle, { color: colors.primary }]}>Account Created Successfully</Text>
                <Text style={[styles.successSlipDesc, { color: colors.textSecondary }]}>
                  Temporary activation credentials issued for {email}:
                </Text>
                <View style={[styles.passwordBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.passwordText, { color: colors.text }]}>{createdPassword}</Text>
                </View>
                <Text style={[styles.successNotice, { color: colors.textSecondary }]}>
                  Provide this one-time password to the staff member. They will be prompted to verify credentials upon first login.
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  resetForm();
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: colors.primary },
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.saveText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {error ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.dangerSoft }]}>
                  <AppIcon ios="exclamationmark.circle.fill" android="error" color={colors.danger} size={16} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              ) : null}

              <EditorField label="Full name" value={fullName} onChangeText={setFullName} colors={colors} />
              <EditorField label="Work email" value={email} onChangeText={setEmail} colors={colors} />
              <EditorField
                label="Job title (optional)"
                value={jobTitle}
                onChangeText={setJobTitle}
                colors={colors}
              />

              <View style={styles.editorField}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>ASSIGN RBAC ROLE</Text>
                <View style={styles.roleChips}>
                  {availableRoles.map((r) => {
                    const active = role === r;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => setRole(r)}
                        style={[
                          styles.roleChip,
                          {
                            backgroundColor: active ? colors.primary : colors.backgroundElement,
                            borderColor: active ? colors.primaryDark : colors.border,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.roleChipText,
                            { color: active ? colors.white : colors.text },
                          ]}>
                          {ROLE_DEFINITIONS[r].shortTitle}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.editorActions}>
                <Pressable
                  onPress={() => {
                    resetForm();
                    onClose();
                  }}
                  style={[styles.cancelButton, { borderColor: colors.border }]}>
                  <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  disabled={loading}
                  onPress={handleProvision}
                  style={({ pressed }) => [
                    styles.saveButton,
                    { backgroundColor: colors.primary },
                    (loading || pressed) && styles.pressed,
                  ]}>
                  <Text style={styles.saveText}>{loading ? 'Creating...' : 'Issue Access'}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  profile: {
    minHeight: 116,
    borderRadius: 8,
    borderWidth: 1,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatar: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  profileInitials: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  profileMain: { flex: 1, gap: 3 },
  profileName: { fontSize: 17, fontWeight: '800' },
  profileRole: { fontSize: 11 },
  verified: {
    alignSelf: 'flex-start',
    height: 24,
    borderRadius: 5,
    borderWidth: 1,
    marginTop: 5,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  verifiedText: { fontSize: 9, fontWeight: '800' },
  editButton: { height: 36, borderRadius: 6, borderWidth: 1, paddingHorizontal: 13, justifyContent: 'center' },
  editText: { fontSize: 10, fontWeight: '800' },
  settingsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  settingCard: {
    width: '48.9%',
    minHeight: 100,
    borderRadius: 8,
    borderWidth: 1,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  settingCardCompact: { width: '100%' },
  settingIcon: { width: 38, height: 38, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  settingMain: { flex: 1, gap: 2 },
  settingTitle: { fontSize: 12, fontWeight: '800' },
  settingDescription: { fontSize: 9, lineHeight: 13 },
  settingDetail: { fontSize: 8, lineHeight: 12 },
  section: { gap: Spacing.three },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionSubtitle: { fontSize: 10, marginTop: 2 },
  inviteButton: {
    height: 38,
    borderRadius: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  inviteText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  teamList: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  teamRow: { minHeight: 64, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  teamAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  teamInitials: { fontSize: 10, fontWeight: '800' },
  teamMain: { flex: 1, gap: 2 },
  teamName: { fontSize: 12, fontWeight: '800' },
  teamRole: { fontSize: 10 },
  accessBadge: { height: 24, borderRadius: 5, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  accessText: { fontSize: 9, fontWeight: '800' },
  audit: { minHeight: 76, borderRadius: 8, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  auditMain: { flex: 1, gap: 3 },
  auditTitle: { fontSize: 11, fontWeight: '800' },
  auditText: { fontSize: 9, lineHeight: 13 },
  signOut: { minHeight: 44, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  signOutText: { fontSize: 12, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(10, 19, 16, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  closeButton: { width: 34, height: 34, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  formLabel: { fontSize: 10, fontWeight: '700' },
  editorModal: { width: '100%', maxWidth: 440, borderRadius: 8, padding: 20, gap: 16 },
  editorField: { gap: 6 },
  fieldHint: { fontSize: 11, lineHeight: 15, marginTop: -8, marginBottom: 2 },
  editorInput: { height: 44, borderRadius: 6, borderWidth: 1, paddingHorizontal: 12, fontSize: 12 },
  switchRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchLabel: { flex: 1, fontSize: 12, fontWeight: '700' },
  editorActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: { flex: 1, height: 44, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 11, fontWeight: '800' },
  saveButton: { flex: 1, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  lockedNotice: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  lockedNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  lockedNoticeDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  roleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  successSlip: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  successSlipTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  successSlipDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  passwordBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
  },
  passwordText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  successNotice: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  pressed: { opacity: 0.65 },
});
