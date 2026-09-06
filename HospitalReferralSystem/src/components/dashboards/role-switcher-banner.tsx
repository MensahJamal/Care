import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { Colors, Spacing } from '@/constants/theme';
import { AppRole, ROLE_DEFINITIONS } from '@/constants/roles';
import { useAuth } from '@/context/auth-context';

export function RoleSwitcherBanner() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profile, signOutUser } = useAuth();
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const currentRole = (profile?.role as AppRole) || 'pcp';
  const roleMeta = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.pcp;

  return (
    <>
      <View
        style={[
          styles.banner,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.roleInfo}>
          <View
            style={[
              styles.roleBadge,
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
            <Text
              style={[
                styles.roleBadgeText,
                { color: roleMeta.badgeColor.text },
              ]}>
              {roleMeta.title}
            </Text>
          </View>
          <View style={styles.secureTag}>
            <AppIcon ios="lock.fill" android="lock" color={colors.textSecondary} size={11} />
            <Text style={[styles.roleHint, { color: colors.textSecondary }]}>
              Strict RBAC Session · No In-Session Role Switching
            </Text>
          </View>
        </View>

        <View style={styles.actionsCluster}>
          <Pressable
            onPress={() => setInfoModalOpen(true)}
            style={({ pressed }) => [
              styles.infoButton,
              { borderColor: colors.border },
              pressed && styles.pressed,
            ]}>
            <AppIcon ios="info.circle" android="info" color={colors.textSecondary} size={13} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>Policy</Text>
          </Pressable>

          <Pressable
            onPress={signOutUser}
            style={({ pressed }) => [
              styles.signOutBtn,
              {
                backgroundColor: colors.dangerSoft,
                borderColor: colors.danger,
              },
              pressed && styles.pressed,
            ]}>
            <AppIcon
              ios="arrow.right.square"
              android="logout"
              color={colors.danger}
              size={13}
            />
            <Text style={[styles.signOutText, { color: colors.danger }]}>
              Sign Out to Switch
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={infoModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <AppIcon ios="lock.shield.fill" android="security" color={colors.primary} size={22} />
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Role Access & Security Policy
                  </Text>
                  <Text
                    style={[
                      styles.modalSubtitle,
                      { color: colors.textSecondary },
                    ]}>
                    Strict Role-Based Access Control Guidelines
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setInfoModalOpen(false)}
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.backgroundElement },
                ]}>
                <AppIcon ios="xmark" android="close" color={colors.text} size={16} />
              </Pressable>
            </View>

            <View style={styles.policyBody}>
              <View style={[styles.policyCard, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.policyHeading, { color: colors.text }]}>
                  1. Role Switching is Prohibited
                </Text>
                <Text style={[styles.policyDesc, { color: colors.textSecondary }]}>
                  Users cannot switch roles within an active session. Each session is cryptographically tied to the verified user profile and assigned role.
                </Text>
              </View>

              <View style={[styles.policyCard, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.policyHeading, { color: colors.text }]}>
                  2. Credential Provisioning Authority
                </Text>
                <Text style={[styles.policyDesc, { color: colors.textSecondary }]}>
                  To access another role (PCP, Specialist, Intake Staff, Lab Tech, or Pharmacist), you must obtain unique login credentials provisioned by either:
                  {'\n'}• Your Hospital Administrator (for facility staff)
                  {'\n'}• The IT Super Administrator (for administrators & cross-facility personnel)
                </Text>
              </View>

              <View style={[styles.policyCard, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.policyHeading, { color: colors.text }]}>
                  3. Accessing Another Portal
                </Text>
                <Text style={[styles.policyDesc, { color: colors.textSecondary }]}>
                  To access a different role portal, you must sign out of your current session and sign in with the distinct login credentials issued for that role.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setInfoModalOpen(false);
                signOutUser();
              }}
              style={({ pressed }) => [
                styles.modalSignOutBtn,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}>
              <AppIcon ios="arrow.right.square" android="logout" color="#FFFFFF" size={15} />
              <Text style={styles.modalSignOutText}>Sign Out Now to Enter Different Credentials</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Alias
export const RoleSessionBanner = RoleSwitcherBanner;

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleHint: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  signOutBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  signOutText: {
    fontSize: 11,
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
    maxWidth: 520,
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
  policyBody: {
    gap: 10,
  },
  policyCard: {
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  policyHeading: {
    fontSize: 12,
    fontWeight: '800',
  },
  policyDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  modalSignOutBtn: {
    height: 42,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  modalSignOutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
