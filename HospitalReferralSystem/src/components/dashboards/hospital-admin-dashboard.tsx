import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { Colors, Spacing } from '@/constants/theme';
import { AppRole, ROLE_DEFINITIONS } from '@/constants/roles';
import { useAuth } from '@/context/auth-context';
import { useReferrals } from '@/context/referral-context';
import { callProvisionStaffUser } from '@/lib/firestore';
import { RoleSwitcherBanner } from './role-switcher-banner';

interface ProvisionedStaff {
  id: string;
  name: string;
  role: AppRole;
  jobTitle: string;
  email: string;
  tempPassword?: string;
  dateIssued: string;
}

const initialProvisioned: ProvisionedStaff[] = [
  {
    id: 'st-01',
    name: 'Dr. Naa Lartey',
    role: 'specialist',
    jobTitle: 'Senior Consultant Cardiologist',
    email: 'specialist@carelink.local',
    dateIssued: 'Active Credential',
  },
  {
    id: 'st-02',
    name: 'Dr. Kwame Addo',
    role: 'pcp',
    jobTitle: 'Primary Care Physician / SMO',
    email: 'pcp@carelink.local',
    dateIssued: 'Active Credential',
  },
  {
    id: 'st-03',
    name: 'Kofi Manu',
    role: 'referral_coordinator',
    jobTitle: 'Referral & Intake Coordinator',
    email: 'coordinator@carelink.local',
    dateIssued: 'Active Credential',
  },
  {
    id: 'st-04',
    name: 'Akosua Darko',
    role: 'lab_technician',
    jobTitle: 'Lead Medical Lab Scientist',
    email: 'lab@carelink.local',
    dateIssued: 'Active Credential',
  },
  {
    id: 'st-05',
    name: 'Pharm. David Osei',
    role: 'pharmacist',
    jobTitle: 'Clinical Specialist Pharmacist',
    email: 'pharmacy@carelink.local',
    dateIssued: 'Active Credential',
  },
];

export function HospitalAdminDashboard() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profile, registerProvisionedAccount } = useAuth();
  const { resources, specialists, updateBeds } = useReferrals();

  const ownFacility =
    resources.find(
      (r) =>
        (profile?.facilityId && r.id.toLowerCase() === profile.facilityId.toLowerCase()) ||
        (profile?.facilityName && r.name.toLowerCase().includes(profile.facilityName.toLowerCase())),
    ) ||
    resources[0] || {
      id: profile?.facilityId || 'kbth',
      name: profile?.facilityName || 'Korle Bu Teaching Hospital',
      beds: 24,
      totalBeds: 180,
      specialists: 12,
    };

  const [bedsCount, setBedsCount] = useState(ownFacility.beds);
  const [provisionList, setProvisionList] = useState<ProvisionedStaff[]>(initialProvisioned);
  const [modalOpen, setModalOpen] = useState(false);
  const [issuedSlip, setIssuedSlip] = useState<ProvisionedStaff | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('specialist');

  const occupancyPercent = Math.round(((ownFacility.totalBeds - bedsCount) / ownFacility.totalBeds) * 100);

  async function adjustBeds(delta: number) {
    const nextVal = Math.max(0, Math.min(ownFacility.totalBeds, bedsCount + delta));
    setBedsCount(nextVal);
    await updateBeds(ownFacility.id, nextVal);
  }

  async function handleProvisionStaff() {
    if (!fullName.trim() || !email.trim()) return;

    const tempPassword = `CareLink#${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanEmail = email.trim().toLowerCase();
    const resolvedJobTitle = jobTitle.trim() || ROLE_DEFINITIONS[selectedRole].title;

    const newCred: ProvisionedStaff = {
      id: `st-${Date.now().toString().slice(-4)}`,
      name: fullName.trim(),
      role: selectedRole,
      jobTitle: resolvedJobTitle,
      email: cleanEmail,
      tempPassword,
      dateIssued: 'Just Issued',
    };

    // Register into local auth context for demo sign-in capability
    registerProvisionedAccount({
      uid: newCred.id,
      displayName: newCred.name,
      email: cleanEmail,
      role: selectedRole,
      jobTitle: resolvedJobTitle,
      facilityName: ownFacility.name,
      facilityId: ownFacility.id,
      phone: '',
      notificationsEnabled: true,
      twoStepEnabled: selectedRole === 'hospital_admin' || selectedRole === 'system_admin',
    }, tempPassword);

    // Call Cloud Function if backend is live
    try {
      await callProvisionStaffUser({
        email: cleanEmail,
        password: tempPassword,
        displayName: newCred.name,
        role: selectedRole,
        jobTitle: resolvedJobTitle,
        facilityId: ownFacility.id,
        facilityName: ownFacility.name,
      });
    } catch {
      // Graceful fallback for offline demo mode
    }

    setProvisionList([newCred, ...provisionList]);
    setIssuedSlip(newCred);
    setFullName('');
    setJobTitle('');
    setEmail('');
  }

  return (
    <View style={styles.container}>
      <RoleSwitcherBanner />

      {/* Admin Executive Header */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.heroTop}>
          <View style={styles.adminInfo}>
            <View style={styles.badgeRow}>
              <View style={[styles.adminBadge, { backgroundColor: '#E0F2FE' }]}>
                <AppIcon ios="building.2.fill" android="domain" color="#0284C7" size={14} />
                <Text style={styles.adminBadgeText}>Hospital Administrator Portal</Text>
              </View>
              <Text style={[styles.facilityText, { color: colors.textSecondary }]}>
                {profile?.facilityName || 'Korle Bu Teaching Hospital'} (KBTH-01)
              </Text>
            </View>

            <Text style={[styles.adminName, { color: colors.text }]}>
              {profile?.displayName || 'Administrator Mensah'}
            </Text>
            <Text style={[styles.adminSub, { color: colors.textSecondary }]}>
              {profile?.jobTitle || 'Director of Clinical Operations'} · Hospital Executive & Credential Authority
            </Text>
          </View>

          <Pressable
            onPress={() => setModalOpen(true)}
            style={({ pressed }) => [
              styles.staffBtn,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}>
            <AppIcon ios="person.badge.key.fill" android="key" color="#FFFFFF" size={15} />
            <Text style={styles.staffBtnText}>Provision Staff Login</Text>
          </Pressable>
        </View>

        {/* Operational KPIs */}
        <View style={[styles.kpiRow, { borderTopColor: colors.border }]}>
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiVal, { color: colors.primary }]}>{occupancyPercent}%</Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Bed Occupancy Rate</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiVal, { color: colors.text }]}>{bedsCount}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Available Beds</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiVal, { color: colors.info }]}>{provisionList.length} Staff</Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Provisioned Roles</Text>
          </View>
        </View>
      </View>

      {/* Staff Login Credential Provisioning Directory */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Hospital Staff Credentials & Access Directory
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {"Credentials issued by this facility's administration. Staff must log in with these exact details."}
            </Text>
          </View>

          <Pressable
            onPress={() => setModalOpen(true)}
            style={({ pressed }) => [
              styles.smallAddBtn,
              { backgroundColor: colors.primarySoft, borderColor: colors.primary },
              pressed && styles.pressed,
            ]}>
            <AppIcon ios="plus" android="add" color={colors.primary} size={14} />
            <Text style={[styles.smallAddBtnText, { color: colors.primary }]}>Issue New Login</Text>
          </Pressable>
        </View>

        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {provisionList.map((st, i) => {
            const roleMeta = ROLE_DEFINITIONS[st.role] || ROLE_DEFINITIONS.pcp;
            return (
              <View
                key={st.id}
                style={[
                  styles.staffRow,
                  i < provisionList.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}>
                <View style={[styles.staffIcon, { backgroundColor: roleMeta.badgeColor.bg }]}>
                  <AppIcon ios={roleMeta.icon.ios} android={roleMeta.icon.android} color={roleMeta.badgeColor.text} size={16} />
                </View>

                <View style={styles.staffMain}>
                  <View style={styles.staffNameLine}>
                    <Text style={[styles.staffName, { color: colors.text }]}>{st.name}</Text>
                    <View
                      style={[
                        styles.rolePill,
                        { backgroundColor: roleMeta.badgeColor.bg, borderColor: roleMeta.badgeColor.border },
                      ]}>
                      <Text style={[styles.rolePillText, { color: roleMeta.badgeColor.text }]}>
                        {roleMeta.shortTitle}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.staffTitle, { color: colors.textSecondary }]}>{st.jobTitle}</Text>
                  <Text style={[styles.staffCreds, { color: colors.textSecondary }]}>
                    Login: <Text style={{ fontWeight: '700', color: colors.text }}>{st.email}</Text> · Password: <Text style={{ fontWeight: '700', color: colors.text }}>{st.tempPassword}</Text>
                  </Text>
                </View>

                <View style={[styles.activeTag, { backgroundColor: colors.primarySoft }]}>
                  <AppIcon ios="checkmark.shield.fill" android="shield" color={colors.primary} size={12} />
                  <Text style={[styles.activeTagText, { color: colors.primary }]}>{st.dateIssued}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Bed Capacity Quick Controls */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Live Available Beds Controller</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
              Instantly syncs with regional dispatch network to open or throttle incoming ambulances
            </Text>
          </View>
          <View style={[styles.livePill, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.liveText, { color: colors.primary }]}>Live Network Sync</Text>
          </View>
        </View>

        <View style={styles.controllerRow}>
          <View style={styles.bedDisplay}>
            <Text style={[styles.bigBedNum, { color: colors.text }]}>{bedsCount}</Text>
            <Text style={[styles.totalBedsLabel, { color: colors.textSecondary }]}>
              / {ownFacility.totalBeds} total facility beds
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <Pressable
              onPress={() => adjustBeds(-1)}
              style={({ pressed }) => [
                styles.adjustBtn,
                { borderColor: colors.border, backgroundColor: colors.backgroundElement },
                pressed && styles.pressed,
              ]}>
              <AppIcon ios="minus" android="remove" color={colors.text} size={18} />
            </Pressable>
            <Pressable
              onPress={() => adjustBeds(1)}
              style={({ pressed }) => [
                styles.adjustBtn,
                { borderColor: colors.primary, backgroundColor: colors.primarySoft },
                pressed && styles.pressed,
              ]}>
              <AppIcon ios="plus" android="add" color={colors.primary} size={18} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Department Specialists On Call */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Clinical Staff & On-Call Specialist Roster
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Doctors authorized to accept emergency transfers
            </Text>
          </View>
        </View>

        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {specialists.map((doc, i) => (
            <View
              key={doc.id}
              style={[
                styles.docRow,
                i < specialists.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}>
              <View style={[styles.docAvatar, { backgroundColor: colors.primarySoft }]}>
                <AppIcon ios="stethoscope" android="medical_services" color={colors.primary} size={16} />
              </View>
              <View style={styles.docInfo}>
                <Text style={[styles.docName, { color: colors.text }]}>{doc.name}</Text>
                <Text style={[styles.docSpecialty, { color: colors.textSecondary }]}>
                  {doc.specialty} · Facility: {doc.facilityId}
                </Text>
              </View>
              <View
                style={[
                  styles.onCallPill,
                  { backgroundColor: doc.isOnCall ? colors.primarySoft : colors.backgroundElement },
                ]}>
                <Text
                  style={[
                    styles.onCallText,
                    { color: doc.isOnCall ? colors.primary : colors.textSecondary },
                  ]}>
                  {doc.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Credential Provisioning Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalOpen(false);
          setIssuedSlip(null);
        }}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <AppIcon ios="person.badge.key.fill" android="key" color={colors.primary} size={22} />
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Provision Staff Login Credentials</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    Create official login access for clinical personnel at {profile?.facilityName || 'your facility'}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  setModalOpen(false);
                  setIssuedSlip(null);
                }}
                style={[styles.closeButton, { backgroundColor: colors.backgroundElement }]}>
                <AppIcon ios="xmark" android="close" color={colors.text} size={16} />
              </Pressable>
            </View>

            {issuedSlip ? (
              <View style={[styles.slipCard, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
                <View style={styles.slipHeader}>
                  <AppIcon ios="checkmark.seal.fill" android="verified" color={colors.primary} size={24} />
                  <Text style={[styles.slipTitle, { color: colors.primary }]}>Credentials Successfully Issued!</Text>
                </View>
                <Text style={[styles.slipSub, { color: colors.textSecondary }]}>
                  Hand these secure login details to the staff member. They will sign in using these exact credentials.
                </Text>

                <View style={[styles.slipDetails, { backgroundColor: colors.surface }]}>
                  <View style={styles.slipRow}>
                    <Text style={[styles.slipLabel, { color: colors.textSecondary }]}>Staff Name:</Text>
                    <Text style={[styles.slipVal, { color: colors.text }]}>{issuedSlip.name}</Text>
                  </View>
                  <View style={styles.slipRow}>
                    <Text style={[styles.slipLabel, { color: colors.textSecondary }]}>Assigned Role:</Text>
                    <Text style={[styles.slipVal, { color: colors.primary }]}>
                      {ROLE_DEFINITIONS[issuedSlip.role]?.title}
                    </Text>
                  </View>
                  <View style={styles.slipRow}>
                    <Text style={[styles.slipLabel, { color: colors.textSecondary }]}>Work Email:</Text>
                    <Text style={[styles.slipVal, { color: colors.text, fontWeight: '800' }]}>{issuedSlip.email}</Text>
                  </View>
                  <View style={styles.slipRow}>
                    <Text style={[styles.slipLabel, { color: colors.textSecondary }]}>Temporary Password:</Text>
                    <Text style={[styles.slipVal, { color: colors.danger, fontWeight: '800' }]}>{issuedSlip.tempPassword}</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    setIssuedSlip(null);
                    setModalOpen(false);
                  }}
                  style={[styles.doneBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.formFields}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Staff Full Name</Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="e.g. Dr. Jane Mensah"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Assign Clinical / Facility Role</Text>
                  <View style={styles.rolesRow}>
                    {(['pcp', 'specialist', 'referral_coordinator', 'lab_technician', 'pharmacist'] as AppRole[]).map((r) => {
                      const meta = ROLE_DEFINITIONS[r];
                      const isSelected = selectedRole === r;
                      return (
                        <Pressable
                          key={r}
                          onPress={() => setSelectedRole(r)}
                          style={[
                            styles.roleSelectChip,
                            {
                              backgroundColor: isSelected ? meta.badgeColor.bg : colors.backgroundElement,
                              borderColor: isSelected ? meta.badgeColor.text : colors.border,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.roleSelectChipText,
                              { color: isSelected ? meta.badgeColor.text : colors.textSecondary },
                              isSelected && { fontWeight: '800' },
                            ]}>
                            {meta.shortTitle}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Job Title</Text>
                  <TextInput
                    value={jobTitle}
                    onChangeText={setJobTitle}
                    placeholder="e.g. Consultant Neurosurgeon / Intake Officer"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Staff Work Email Address (Login ID)</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="e.g. j.mensah@carelink.local"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  />
                </View>

                <Pressable
                  onPress={handleProvisionStaff}
                  style={({ pressed }) => [
                    styles.issueBtn,
                    { backgroundColor: colors.primary },
                    pressed && styles.pressed,
                  ]}>
                  <AppIcon ios="key.fill" android="vpn_key" color="#FFFFFF" size={15} />
                  <Text style={styles.issueBtnText}>Generate & Issue Login Credentials</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  adminInfo: {
    flex: 1,
    gap: 3,
    minWidth: 260,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  adminBadgeText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '800',
  },
  facilityText: {
    fontSize: 11,
  },
  adminName: {
    fontSize: 18,
    fontWeight: '800',
  },
  adminSub: {
    fontSize: 11,
  },
  staffBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  staffBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  kpiRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  kpiCol: {
    alignItems: 'center',
    gap: 2,
  },
  kpiVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 10,
  },
  divider: {
    width: 1,
    height: 30,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
  },
  smallAddBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  smallAddBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  listCard: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  staffRow: {
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  staffIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffMain: {
    flex: 1,
    gap: 2,
  },
  staffNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  staffName: {
    fontSize: 13,
    fontWeight: '800',
  },
  rolePill: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rolePillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  staffTitle: {
    fontSize: 11,
  },
  staffCreds: {
    fontSize: 10,
    marginTop: 2,
  },
  activeTag: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.four,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  livePill: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
  },
  controllerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bedDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  bigBedNum: {
    fontSize: 32,
    fontWeight: '800',
  },
  totalBedsLabel: {
    fontSize: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  adjustBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docRow: {
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
    gap: 2,
  },
  docName: {
    fontSize: 13,
    fontWeight: '800',
  },
  docSpecialty: {
    fontSize: 11,
  },
  onCallPill: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  onCallText: {
    fontSize: 10,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 19, 16, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formFields: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleSelectChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  roleSelectChipText: {
    fontSize: 10,
  },
  issueBtn: {
    height: 42,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  issueBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  slipCard: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  slipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slipTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  slipSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  slipDetails: {
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  slipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slipLabel: {
    fontSize: 11,
  },
  slipVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  doneBtn: {
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
