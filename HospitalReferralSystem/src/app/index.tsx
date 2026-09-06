import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { Screen } from '@/components/ui/screen';
import { ErrorBoundary } from '@/components/error-boundary';
import { Colors } from '@/constants/theme';
import { AppRole, ROLE_DEFINITIONS } from '@/constants/roles';
import { useAuth } from '@/context/auth-context';
import { useReferrals } from '@/context/referral-context';

import { PatientDashboard } from '@/components/dashboards/patient-dashboard';
import { PcpDashboard } from '@/components/dashboards/pcp-dashboard';
import { SpecialistDashboard } from '@/components/dashboards/specialist-dashboard';
import { CoordinatorDashboard } from '@/components/dashboards/coordinator-dashboard';
import { HospitalAdminDashboard } from '@/components/dashboards/hospital-admin-dashboard';
import { SystemAdminDashboard } from '@/components/dashboards/system-admin-dashboard';
import { LabDashboard } from '@/components/dashboards/lab-dashboard';
import { PharmacistDashboard } from '@/components/dashboards/pharmacist-dashboard';

export default function DashboardScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profile } = useAuth();
  const { referrals } = useReferrals();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const currentRole = (profile?.role as AppRole) || 'pcp';
  const roleMeta = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.pcp;
  const displayName = profile?.displayName || roleMeta.demoCredentials.displayName;
  const facilityName = profile?.facilityName || roleMeta.demoCredentials.facilityName;

  const pendingCount = referrals.filter((r) => r.status === 'Pending').length;

  function renderRoleDashboard() {
    switch (currentRole) {
      case 'patient':
        return <PatientDashboard />;
      case 'pcp':
        return <PcpDashboard />;
      case 'specialist':
        return <SpecialistDashboard />;
      case 'referral_coordinator':
        return <CoordinatorDashboard />;
      case 'hospital_admin':
        return <HospitalAdminDashboard />;
      case 'system_admin':
        return <SystemAdminDashboard />;
      case 'lab_technician':
        return <LabDashboard />;
      case 'pharmacist':
        return <PharmacistDashboard />;
      default:
        return <PcpDashboard />;
    }
  }

  return (
    <>
      <Screen
        title={`Hello, ${displayName}`}
        subtitle={`${roleMeta.title} · ${facilityName}`}
        action={
          <View style={styles.actionCluster}>
            <View
              style={[
                styles.roleTag,
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
              <Text
                style={[
                  styles.roleTagText,
                  { color: roleMeta.badgeColor.text },
                ]}>
                {roleMeta.shortTitle}
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Notifications"
              onPress={() => setNotificationsOpen(true)}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.pressed,
              ]}>
              <AppIcon ios="bell" android="notifications" color={colors.text} size={18} />
              {pendingCount > 0 ? (
                <View style={[styles.notificationDot, { borderColor: colors.surface }]} />
              ) : null}
            </Pressable>
          </View>
        }>
        <ErrorBoundary name={`${roleMeta.shortTitle} Dashboard`}>
          {renderRoleDashboard()}
        </ErrorBoundary>
      </Screen>

      <Modal
        visible={notificationsOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setNotificationsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppIcon ios="bell.fill" android="notifications" color={colors.primary} size={20} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Clinical Notifications</Text>
              </View>
              <Pressable
                accessibilityLabel="Close notifications"
                onPress={() => setNotificationsOpen(false)}
                style={[styles.closeButton, { backgroundColor: colors.backgroundElement }]}>
                <AppIcon ios="xmark" android="close" color={colors.text} size={16} />
              </Pressable>
            </View>

            <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
              <View style={[styles.alertItem, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <View style={[styles.alertIcon, { backgroundColor: colors.primarySoft }]}>
                  <AppIcon ios="arrow.left.arrow.right" android="swap_horiz" color={colors.primary} size={16} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.alertTitle, { color: colors.text }]}>
                    {pendingCount} Pending Referral{pendingCount === 1 ? '' : 's'}
                  </Text>
                  <Text style={[styles.alertDesc, { color: colors.textSecondary }]}>
                    Transfers awaiting confirmation or acceptance at {facilityName}.
                  </Text>
                </View>
              </View>

              <View style={[styles.alertItem, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <View style={[styles.alertIcon, { backgroundColor: colors.infoSoft }]}>
                  <AppIcon ios="checkmark.shield.fill" android="verified_user" color={colors.info} size={16} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.alertTitle, { color: colors.text }]}>RBAC Security Active</Text>
                  <Text style={[styles.alertDesc, { color: colors.textSecondary }]}>
                    Role enforced as {roleMeta.title} ({roleMeta.shortTitle}). All PHI data is cryptographically scoped.
                  </Text>
                </View>
              </View>

              <View style={[styles.alertItem, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <View style={[styles.alertIcon, { backgroundColor: colors.accentSoft }]}>
                  <AppIcon ios="waveform.path.ecg" android="monitor_heart" color={colors.accent} size={16} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.alertTitle, { color: colors.text }]}>Facility Capacity Live</Text>
                  <Text style={[styles.alertDesc, { color: colors.textSecondary }]}>
                    ICU and inpatient beds are being synchronized in real time across connected hospitals.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setNotificationsOpen(false)}
              style={({ pressed }) => [
                styles.dismissButton,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}>
              <Text style={styles.dismissText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  actionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleTag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D94B43',
    borderWidth: 1.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationsList: {
    maxHeight: 320,
  },
  alertItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  alertDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  dismissButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  dismissText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
