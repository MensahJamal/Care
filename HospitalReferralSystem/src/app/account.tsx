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
import { useAuth } from '@/context/auth-context';

const demoTeam = [
  { initials: 'NA', name: 'Nana Addo', role: 'Senior Medical Officer', access: 'Administrator' },
  { initials: 'EF', name: 'Efua Frimpong', role: 'Charge Nurse', access: 'Staff' },
  { initials: 'KM', name: 'Kofi Manu', role: 'Referral Coordinator', access: 'Staff' },
];

export default function AccountScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const compact = width < 540;
  const { profile, user, signOutUser } = useAuth();
  const { editProfile } = useAuth();
  const [editor, setEditor] = useState<'profile' | 'facility' | 'contact' | 'notifications' | 'security' | null>(null);
  const isAdministrator = profile?.role === 'administrator';
  const loginEmail = user?.email ?? profile?.email;
  const displayName = loginEmail
    ? loginEmail
        .split('@')[0]
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Clinical user';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Screen title="Account & administration" subtitle="Manage your profile, facility and staff access">
      <View style={[styles.profile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.profileInitials}>{initials}</Text>
        </View>
        <View style={styles.profileMain}>
          <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.profileRole, { color: colors.textSecondary }]}>
            {profile?.jobTitle} · {isAdministrator ? 'Administrator' : 'Staff'}
          </Text>
          <View style={[styles.verified, { backgroundColor: colors.primarySoft }]}>
            <AppIcon ios="checkmark.shield.fill" android="shield_person" color={colors.primary} size={13} />
            <Text style={[styles.verifiedText, { color: colors.primary }]}>Verified clinical account</Text>
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
          detail={profile?.facilityId ? `${profile.facilityId} · Connected` : 'Facility not assigned'}
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
          detail={profile?.notificationsEnabled ? 'Email and push enabled' : 'Email and push disabled'}
        />
        <SettingCard
          onPress={() => setEditor('security')}
          compact={compact}
          icon={{ ios: 'lock.shield', android: 'shield_person' }}
          title="Security"
          description={profile?.twoStepEnabled ? 'Two-step verification' : 'Standard sign-in'}
          detail={profile?.twoStepEnabled ? 'Additional verification enabled' : 'Additional verification disabled'}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Staff access</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Administrators can invite staff and assign permissions
            </Text>
          </View>
          {isAdministrator ? (
            <Pressable
              style={({ pressed }) => [
                styles.inviteButton,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}>
              <AppIcon ios="person.badge.plus" android="group" color={colors.white} size={16} />
              <Text style={styles.inviteText}>Invite staff</Text>
            </Pressable>
          ) : null}
        </View>
        {!isAdministrator ? (
          <Text style={[styles.accessNotice, { color: colors.textSecondary, backgroundColor: colors.backgroundElement }]}>Staff access is managed by your facility administrator.</Text>
        ) : null}
        <View style={[styles.teamList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {demoTeam.map((member, index) => (
            <View
              key={member.name}
              style={[
                styles.teamRow,
                index < demoTeam.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
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
                    backgroundColor:
                      member.access === 'Administrator' ? colors.primarySoft : colors.backgroundElement,
                  },
                ]}>
                <Text
                  style={[
                    styles.accessText,
                    {
                      color:
                        member.access === 'Administrator' ? colors.primary : colors.textSecondary,
                    },
                  ]}>
                  {member.access}
                </Text>
              </View>
              <Pressable accessibilityLabel={`More options for ${member.name}`} hitSlop={10}>
                <AppIcon ios="ellipsis" android="more_horiz" color={colors.textSecondary} size={18} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <Pressable onPress={signOutUser} style={({ pressed }) => [styles.signOut, { borderColor: colors.border }, pressed && styles.pressed]}>
        <Text style={[styles.signOutText, { color: colors.danger }]}>Sign out</Text>
      </Pressable>

      <View style={[styles.audit, { backgroundColor: colors.infoSoft }]}>
        <AppIcon ios="doc.text.magnifyingglass" android="search" color={colors.info} size={20} />
        <View style={styles.auditMain}>
          <Text style={[styles.auditTitle, { color: colors.text }]}>Clinical audit log</Text>
          <Text style={[styles.auditText, { color: colors.textSecondary }]}>
            Referral decisions and capacity changes are recorded for accountability.
          </Text>
        </View>
        <AppIcon ios="chevron.right" android="arrow_forward" color={colors.info} size={17} />
      </View>
      <AccountEditor
        section={editor}
        profile={profile}
        onClose={() => setEditor(null)}
        onSave={async (updates) => {
          await editProfile(updates);
          setEditor(null);
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
  onClose,
  onSave,
}: {
  section: 'profile' | 'facility' | 'contact' | 'notifications' | 'security' | null;
  profile: ReturnType<typeof useAuth>['profile'];
  onClose: () => void;
  onSave: (updates: Partial<NonNullable<ReturnType<typeof useAuth>['profile']>>) => Promise<void>;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [jobTitle, setJobTitle] = useState(profile?.jobTitle ?? '');
  const [facilityName, setFacilityName] = useState(profile?.facilityName ?? '');
  const [facilityId, setFacilityId] = useState(profile?.facilityId ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notificationsEnabled ?? true);
  const [twoStepEnabled, setTwoStepEnabled] = useState(profile?.twoStepEnabled ?? false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setJobTitle(profile?.jobTitle ?? '');
    setFacilityName(profile?.facilityName ?? '');
    setFacilityId(profile?.facilityId ?? '');
    setPhone(profile?.phone ?? '');
    setNotificationsEnabled(profile?.notificationsEnabled ?? true);
    setTwoStepEnabled(profile?.twoStepEnabled ?? false);
  }, [profile, section]);

  if (!section || !profile) return null;

  const titles = {
    profile: 'Edit profile',
    facility: 'Edit facility profile',
    contact: 'Edit referral contact',
    notifications: 'Edit notifications',
    security: 'Edit security',
  };

  async function save() {
    setSaving(true);
    try {
      const updates =
        section === 'profile'
          ? { jobTitle }
          : section === 'facility'
            ? { facilityName, facilityId }
            : section === 'contact'
              ? { phone }
              : section === 'notifications'
                ? { notificationsEnabled }
                : { twoStepEnabled };
      await onSave(updates);
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
            <Pressable accessibilityLabel="Close editor" onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.backgroundElement }]}>
              <AppIcon ios="xmark" android="close" color={colors.text} size={17} />
            </Pressable>
          </View>

          {section === 'profile' ? <EditorField label="Job title" value={jobTitle} onChangeText={setJobTitle} colors={colors} /> : null}
          {section === 'facility' ? (
            <>
              <EditorField label="Facility name" value={facilityName} onChangeText={setFacilityName} colors={colors} />
              <EditorField label="Facility ID" value={facilityId} onChangeText={setFacilityId} colors={colors} />
            </>
          ) : null}
          {section === 'contact' ? <EditorField label="Phone number" value={phone} onChangeText={setPhone} colors={colors} /> : null}
          {section === 'notifications' ? (
            <EditorSwitch label="Emergency referral notifications" value={notificationsEnabled} onValueChange={setNotificationsEnabled} colors={colors} />
          ) : null}
          {section === 'security' ? (
            <EditorSwitch label="Two-step verification" value={twoStepEnabled} onValueChange={setTwoStepEnabled} colors={colors} />
          ) : null}

          <View style={styles.editorActions}>
            <Pressable onPress={onClose} style={[styles.cancelButton, { borderColor: colors.border }]}>
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
            <Pressable disabled={saving} onPress={save} style={[styles.saveButton, { backgroundColor: colors.primary }, saving && styles.pressed]}>
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
      <TextInput value={value} onChangeText={onChangeText} style={[styles.editorInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]} />
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
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.primarySoft }} thumbColor={value ? colors.primary : colors.textSecondary} />
    </View>
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
  profileRole: { fontSize: 10 },
  verified: {
    alignSelf: 'flex-start',
    height: 24,
    borderRadius: 5,
    marginTop: 5,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  verifiedText: { fontSize: 8, fontWeight: '800' },
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
  sectionTitle: { fontSize: 17, fontWeight: '800' },
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
  accessNotice: { borderRadius: 6, padding: 10, fontSize: 10, lineHeight: 15 },
  teamList: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  teamRow: { minHeight: 72, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  teamAvatar: { width: 37, height: 37, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  teamInitials: { fontSize: 10, fontWeight: '800' },
  teamMain: { flex: 1, gap: 2 },
  teamName: { fontSize: 11, fontWeight: '800' },
  teamRole: { fontSize: 9 },
  accessBadge: { height: 24, borderRadius: 5, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  accessText: { fontSize: 8, fontWeight: '800' },
  audit: { minHeight: 76, borderRadius: 8, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  auditMain: { flex: 1, gap: 3 },
  auditTitle: { fontSize: 11, fontWeight: '800' },
  auditText: { fontSize: 9, lineHeight: 13 },
  signOut: { minHeight: 42, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  signOutText: { fontSize: 11, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(10, 19, 16, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeButton: { width: 34, height: 34, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  formLabel: { fontSize: 10, fontWeight: '700' },
  editorModal: { width: '100%', maxWidth: 440, borderRadius: 8, padding: 20, gap: 16 },
  editorField: { gap: 6 },
  editorInput: { height: 44, borderRadius: 6, borderWidth: 1, paddingHorizontal: 12, fontSize: 12 },
  switchRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchLabel: { flex: 1, fontSize: 12, fontWeight: '700' },
  editorActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: { flex: 1, height: 44, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 11, fontWeight: '800' },
  saveButton: { flex: 1, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});
