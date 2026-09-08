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
import { ALL_ROLES, AppRole, ROLE_DEFINITIONS } from '@/constants/roles';
import { useAuth } from '@/context/auth-context';
import { callProvisionStaffUser } from '@/lib/firestore';
import { RoleSwitcherBanner } from './role-switcher-banner';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  facility: string;
  lastLogin: string;
  status: 'Active' | 'Suspended';
}

interface IssuedCredentialSlip extends UserRecord {
  tempPassword: string;
}

const initialUsers: UserRecord[] = [
  { id: 'u1', name: 'Ama Serwaa Owusu', email: 'patient@carelink.local', role: 'patient', facility: 'Korle Bu Teaching Hospital', lastLogin: '10 min ago', status: 'Active' },
  { id: 'u2', name: 'Dr. Kwame Addo', email: 'pcp@carelink.local', role: 'pcp', facility: 'Ridge Hospital PolyClinic', lastLogin: 'Just now', status: 'Active' },
  { id: 'u3', name: 'Dr. Naa Lartey', email: 'specialist@carelink.local', role: 'specialist', facility: 'Korle Bu Teaching Hospital', lastLogin: '25 min ago', status: 'Active' },
  { id: 'u4', name: 'Kofi Manu', email: 'coordinator@carelink.local', role: 'referral_coordinator', facility: 'Korle Bu Central Triage', lastLogin: '1 hr ago', status: 'Active' },
  { id: 'u5', name: 'Administrator Mensah', email: 'hospadmin@carelink.local', role: 'hospital_admin', facility: 'Korle Bu Teaching Hospital', lastLogin: '3 hrs ago', status: 'Active' },
  { id: 'u6', name: 'Akosua Darko', email: 'lab@carelink.local', role: 'lab_technician', facility: 'Korle Bu Pathology & Diagnostics', lastLogin: '45 min ago', status: 'Active' },
  { id: 'u7', name: 'Pharm. David Osei', email: 'pharmacy@carelink.local', role: 'pharmacist', facility: 'Korle Bu Central Pharmacy', lastLogin: '2 hrs ago', status: 'Active' },
  { id: 'u8', name: 'Emmanuel Asare', email: 'sysadmin@carelink.local', role: 'system_admin', facility: 'National Health Exchange', lastLogin: 'Active Now', status: 'Active' },
];

const auditEvents = [
  { time: '12:44:02', user: 'Emmanuel Asare (SysAdmin)', action: 'SuperAdmin Provisioned Hospital Admin Credentials', target: 'Security Kernel', status: 'Success' },
  { time: '12:38:15', user: 'Dr. Naa Lartey (Specialist)', action: 'Referral #RF-2048 Bed Assignment', target: 'Ward 3B', status: 'Success' },
  { time: '12:20:41', user: 'Kofi Manu (Intake)', action: 'Dispatched Ambulance AMB-04', target: 'Fleet Tracker', status: 'Success' },
  { time: '11:58:09', user: 'Akosua Darko (Lab)', action: 'Critical Troponin Value Broadcast', target: 'EHR Channel', status: 'Alert' },
];

export function SystemAdminDashboard() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profile, registerProvisionedAccount } = useAuth();

  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [selectedTab, setSelectedTab] = useState<'users' | 'audit' | 'nodes'>('users');
  const [modalOpen, setModalOpen] = useState(false);
  const [issuedSlip, setIssuedSlip] = useState<IssuedCredentialSlip | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [facility, setFacility] = useState('Korle Bu Teaching Hospital');
  const [selectedRole, setSelectedRole] = useState<AppRole>('hospital_admin');

  async function handleProvisionUser() {
    if (!fullName.trim() || !email.trim()) return;

    const tempPassword = `SysAuth#${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanEmail = email.trim().toLowerCase();

    const newUser: UserRecord = {
      id: `u-${Date.now().toString().slice(-4)}`,
      name: fullName.trim(),
      email: cleanEmail,
      role: selectedRole,
      facility: facility.trim(),
      lastLogin: 'Never (Pending Activation)',
      status: 'Active',
    };

    // Register into local auth context for demo sign-in capability
    registerProvisionedAccount({
      uid: newUser.id,
      displayName: newUser.name,
      email: cleanEmail,
      role: selectedRole,
      jobTitle: ROLE_DEFINITIONS[selectedRole].title,
      facilityName: facility.trim(),
      facilityId: 'KBTH-01',
      phone: '',
      notificationsEnabled: true,
      twoStepEnabled: selectedRole === 'hospital_admin' || selectedRole === 'system_admin',
    }, tempPassword);

    let finalTempPassword = tempPassword;
    // Call Cloud Function if live
    try {
      const result = await callProvisionStaffUser({
        email: cleanEmail,
        password: tempPassword,
        displayName: newUser.name,
        role: selectedRole,
        jobTitle: ROLE_DEFINITIONS[selectedRole].title,
        facilityName: facility.trim(),
      });
      if (result.tempPassword) {
        finalTempPassword = result.tempPassword;
      }
    } catch {
      // Graceful fallback in offline demo mode
    }

    setUsers([newUser, ...users]);
    setIssuedSlip({ ...newUser, tempPassword: finalTempPassword });
    setFullName('');
    setEmail('');
  }

  return (
    <View style={styles.container}>
      <RoleSwitcherBanner />

      {/* Super Admin Control Hero */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.heroTop}>
          <View style={styles.sysInfo}>
            <View style={styles.badgeRow}>
              <View style={[styles.superBadge, { backgroundColor: '#FDECEA' }]}>
                <AppIcon ios="shield.lefthalf.filled" android="admin_panel_settings" color="#C2413A" size={14} />
                <Text style={styles.superBadgeText}>National IT & System Super Administrator</Text>
              </View>
              <Text style={[styles.facilityText, { color: colors.textSecondary }]}>
                National Health Exchange (HQ-SYS-001)
              </Text>
            </View>

            <Text style={[styles.sysName, { color: colors.text }]}>
              {profile?.displayName || 'Emmanuel Asare'}
            </Text>
            <Text style={[styles.sysSub, { color: colors.textSecondary }]}>
              Global Credential Issuance · Role Provisioning Authority · Encrypted Audit Trail
            </Text>
          </View>

          <Pressable
            onPress={() => setModalOpen(true)}
            style={({ pressed }) => [
              styles.superProvisionBtn,
              { backgroundColor: colors.danger },
              pressed && styles.pressed,
            ]}>
            <AppIcon ios="person.badge.key.fill" android="vpn_key" color="#FFFFFF" size={15} />
            <Text style={styles.superProvisionBtnText}>Provision Any Role Login</Text>
          </Pressable>
        </View>

        {/* Global Network Health Stats */}
        <View style={[styles.healthRow, { borderTopColor: colors.border }]}>
          <View style={styles.healthCol}>
            <Text style={[styles.healthVal, { color: colors.primary }]}>99.98%</Text>
            <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>Core Exchange Uptime</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.healthCol}>
            <Text style={[styles.healthVal, { color: colors.text }]}>8 Roles</Text>
            <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>Strict RBAC Portals</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.healthCol}>
            <Text style={[styles.healthVal, { color: colors.info }]}>{users.length} Users</Text>
            <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>Provisioned Network Accounts</Text>
          </View>
        </View>
      </View>

      {/* Tabs selector */}
      <View style={[styles.tabBar, { backgroundColor: colors.backgroundElement }]}>
        <Pressable
          onPress={() => setSelectedTab('users')}
          style={[styles.tabBtn, selectedTab === 'users' && { backgroundColor: colors.surface }]}>
          <AppIcon
            ios="person.2.fill"
            android="group"
            color={selectedTab === 'users' ? colors.primary : colors.textSecondary}
            size={16}
          />
          <Text
            style={[
              styles.tabBtnText,
              { color: selectedTab === 'users' ? colors.text : colors.textSecondary },
              selectedTab === 'users' && styles.tabBtnTextActive,
            ]}>
            User Directory & Credentials ({users.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedTab('audit')}
          style={[styles.tabBtn, selectedTab === 'audit' && { backgroundColor: colors.surface }]}>
          <AppIcon
            ios="doc.text.magnifyingglass"
            android="search"
            color={selectedTab === 'audit' ? colors.primary : colors.textSecondary}
            size={16}
          />
          <Text
            style={[
              styles.tabBtnText,
              { color: selectedTab === 'audit' ? colors.text : colors.textSecondary },
              selectedTab === 'audit' && styles.tabBtnTextActive,
            ]}>
            Security Audit Logs
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedTab('nodes')}
          style={[styles.tabBtn, selectedTab === 'nodes' && { backgroundColor: colors.surface }]}>
          <AppIcon
            ios="network"
            android="hub"
            color={selectedTab === 'nodes' ? colors.primary : colors.textSecondary}
            size={16}
          />
          <Text
            style={[
              styles.tabBtnText,
              { color: selectedTab === 'nodes' ? colors.text : colors.textSecondary },
              selectedTab === 'nodes' && styles.tabBtnTextActive,
            ]}>
            Hospital Nodes
          </Text>
        </Pressable>
      </View>

      {/* Tab Content 1: User Directory & Credentials */}
      {selectedTab === 'users' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                National Health User Directory & Assigned Credentials
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Only Super Admin and Hospital Admins can provision these login details. Each user must sign in with their unique credentials.
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
              <Text style={[styles.smallAddBtnText, { color: colors.primary }]}>Provision User</Text>
            </Pressable>
          </View>

          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {users.map((u, i) => {
              const roleMeta = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.patient;
              return (
                <View
                  key={u.id}
                  style={[
                    styles.userRow,
                    i < users.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}>
                  <View style={styles.userMain}>
                    <View style={styles.userNameRow}>
                      <Text style={[styles.userName, { color: colors.text }]}>{u.name}</Text>
                      <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                    </View>
                    <Text style={[styles.userFacility, { color: colors.textSecondary }]}>
                      {u.facility} · Status: {u.status}
                    </Text>
                    <Text style={[styles.userCreds, { color: colors.textSecondary }]}>
                      Login ID: <Text style={{ fontWeight: '700', color: colors.text }}>{u.email}</Text> · Auth: <Text style={{ fontWeight: '700', color: colors.primary }}>Provisioned</Text>
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.roleBadgeDisplay,
                      {
                        backgroundColor: roleMeta.badgeColor.bg,
                        borderColor: roleMeta.badgeColor.border,
                      },
                    ]}>
                    <AppIcon
                      ios={roleMeta.icon.ios}
                      android={roleMeta.icon.android}
                      color={roleMeta.badgeColor.text}
                      size={12}
                    />
                    <Text style={[styles.roleBadgeText, { color: roleMeta.badgeColor.text }]}>
                      {roleMeta.shortTitle}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Tab Content 2: Audit Logs */}
      {selectedTab === 'audit' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Immutable Clinical & Security Audit Log
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Timestamped clinical decisions and privileged actions stored for legal compliance
          </Text>

          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {auditEvents.map((ev, i) => (
              <View
                key={i}
                style={[
                  styles.auditRow,
                  i < auditEvents.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}>
                <View style={[styles.auditDot, { backgroundColor: ev.status === 'Alert' ? colors.danger : colors.primary }]} />
                <View style={styles.auditBody}>
                  <View style={styles.auditTopLine}>
                    <Text style={[styles.auditUser, { color: colors.text }]}>{ev.user}</Text>
                    <Text style={[styles.auditTime, { color: colors.textSecondary }]}>{ev.time}</Text>
                  </View>
                  <Text style={[styles.auditAction, { color: colors.textSecondary }]}>
                    Action: {ev.action} ➔ Target: {ev.target}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Tab Content 3: Nodes */}
      {selectedTab === 'nodes' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Connected Facility Nodes
          </Text>
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.nodeRow}>
              <View style={[styles.nodeIcon, { backgroundColor: colors.primarySoft }]}>
                <AppIcon ios="building.2" android="domain" color={colors.primary} size={18} />
              </View>
              <View style={styles.nodeBody}>
                <Text style={[styles.nodeName, { color: colors.text }]}>Korle Bu Teaching Hospital (KBTH-01)</Text>
                <Text style={[styles.nodeDetails, { color: colors.textSecondary }]}>
                  Tertiary Level 1 Trauma Hub · Bed Sync: Live · FHIR v4.0.1
                </Text>
              </View>
              <View style={[styles.nodeStatus, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.nodeStatusText, { color: colors.primary }]}>Online</Text>
              </View>
            </View>

            <View style={[styles.nodeRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={[styles.nodeIcon, { backgroundColor: colors.primarySoft }]}>
                <AppIcon ios="building.2" android="domain" color={colors.primary} size={18} />
              </View>
              <View style={styles.nodeBody}>
                <Text style={[styles.nodeName, { color: colors.text }]}>Ridge Hospital PolyClinic (RDG-02)</Text>
                <Text style={[styles.nodeDetails, { color: colors.textSecondary }]}>
                  Secondary Referral Node · Bed Sync: Live · HL7 Gateway
                </Text>
              </View>
              <View style={[styles.nodeStatus, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.nodeStatusText, { color: colors.primary }]}>Online</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Super Admin Provisioning Modal */}
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
                <AppIcon ios="shield.lefthalf.filled" android="admin_panel_settings" color={colors.danger} size={22} />
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Super Admin Credential Provisioner</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    Issue role credentials for administrators and clinical users across any facility
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
                  <Text style={[styles.slipTitle, { color: colors.primary }]}>Account Successfully Provisioned!</Text>
                </View>
                <Text style={[styles.slipSub, { color: colors.textSecondary }]}>
                  Deliver these credentials to the user. They must use these exact details to log in to their assigned portal.
                </Text>

                <View style={[styles.slipDetails, { backgroundColor: colors.surface }]}>
                  <View style={styles.slipRow}>
                    <Text style={[styles.slipLabel, { color: colors.textSecondary }]}>User Name:</Text>
                    <Text style={[styles.slipVal, { color: colors.text }]}>{issuedSlip.name}</Text>
                  </View>
                  <View style={styles.slipRow}>
                    <Text style={[styles.slipLabel, { color: colors.textSecondary }]}>Assigned Role:</Text>
                    <Text style={[styles.slipVal, { color: colors.primary }]}>
                      {ROLE_DEFINITIONS[issuedSlip.role]?.title}
                    </Text>
                  </View>
                  <View style={styles.slipRow}>
                    <Text style={[styles.slipLabel, { color: colors.textSecondary }]}>Facility:</Text>
                    <Text style={[styles.slipVal, { color: colors.text }]}>{issuedSlip.facility}</Text>
                  </View>
                  <View style={styles.slipRow}>
                    <Text style={[styles.slipLabel, { color: colors.textSecondary }]}>Login Email:</Text>
                    <Text style={[styles.slipVal, { color: colors.text, fontWeight: '800' }]}>{issuedSlip.email}</Text>
                  </View>
                  <View style={styles.slipRow}>
                    <Text style={[styles.slipLabel, { color: colors.textSecondary }]}>Initial Password:</Text>
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
                  <Text style={[styles.label, { color: colors.textSecondary }]}>User Full Name</Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="e.g. Dr. Jane Mensah / Admin Owusu"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Select National RBAC Role</Text>
                  <View style={styles.rolesRow}>
                    {ALL_ROLES.map((r) => {
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
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Hospital / Facility Node</Text>
                  <TextInput
                    value={facility}
                    onChangeText={setFacility}
                    placeholder="e.g. Korle Bu Teaching Hospital / 37 Military"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Login Email Address</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="e.g. user@carelink.local"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  />
                </View>

                <Pressable
                  onPress={handleProvisionUser}
                  style={({ pressed }) => [
                    styles.issueBtn,
                    { backgroundColor: colors.primary },
                    pressed && styles.pressed,
                  ]}>
                  <AppIcon ios="key.fill" android="vpn_key" color="#FFFFFF" size={15} />
                  <Text style={styles.issueBtnText}>Provision & Generate Credentials</Text>
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
  sysInfo: {
    flex: 1,
    gap: 3,
    minWidth: 260,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  superBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  superBadgeText: {
    color: '#C2413A',
    fontSize: 10,
    fontWeight: '800',
  },
  facilityText: {
    fontSize: 11,
  },
  sysName: {
    fontSize: 18,
    fontWeight: '800',
  },
  sysSub: {
    fontSize: 11,
  },
  superProvisionBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  superProvisionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  healthRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  healthCol: {
    alignItems: 'center',
    gap: 2,
  },
  healthVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  healthLabel: {
    fontSize: 10,
  },
  divider: {
    width: 1,
    height: 30,
  },
  tabBar: {
    borderRadius: 8,
    padding: 3,
    flexDirection: 'row',
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    fontWeight: '800',
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
  userRow: {
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  userMain: {
    flex: 1,
    gap: 2,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  userFacility: {
    fontSize: 11,
  },
  userCreds: {
    fontSize: 10,
    marginTop: 2,
  },
  roleBadgeDisplay: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  auditRow: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  auditDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  auditBody: {
    flex: 1,
    gap: 2,
  },
  auditTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditUser: {
    fontSize: 12,
    fontWeight: '700',
  },
  auditTime: {
    fontSize: 10,
  },
  auditAction: {
    fontSize: 11,
  },
  nodeRow: {
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nodeIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeBody: {
    flex: 1,
    gap: 2,
  },
  nodeName: {
    fontSize: 13,
    fontWeight: '800',
  },
  nodeDetails: {
    fontSize: 11,
  },
  nodeStatus: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  nodeStatusText: {
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
