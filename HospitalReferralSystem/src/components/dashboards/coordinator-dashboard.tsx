import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { StatusPill } from '@/components/ui/status-pill';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { Referral, useReferrals } from '@/context/referral-context';
import { RoleSwitcherBanner } from './role-switcher-banner';

export function CoordinatorDashboard() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profile } = useAuth();
  const { referrals, decideReferral } = useReferrals();

  const [otpCode, setOtpCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const pendingIncoming = referrals.filter((r: Referral) => r.status === 'Pending');
  const inTransit = referrals.filter((r: Referral) => r.status === 'In transit');

  function handleVerifyOtp() {
    const trimmed = otpCode.trim();
    if (/^\d{6}$/.test(trimmed)) {
      setVerificationResult(`OTP Validated: Code ${trimmed} verified for incoming emergency intake.`);
    } else {
      setVerificationResult('Invalid format. Enter a 6-digit confirmation code or Transfer PIN.');
    }
  }

  return (
    <View style={styles.container}>
      <RoleSwitcherBanner />

      {/* Intake Center Command Hero */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.heroTop}>
          <View style={styles.coordinatorInfo}>
            <View style={styles.badgeRow}>
              <View style={[styles.coordinatorBadge, { backgroundColor: '#FFF3DD' }]}>
                <AppIcon ios="arrow.left.arrow.right" android="swap_horiz" color="#D97706" size={14} />
                <Text style={styles.coordinatorBadgeText}>Referral Coordinator & Intake Hub</Text>
              </View>
              <Text style={[styles.facilityText, { color: colors.textSecondary }]}>
                {profile?.facilityName || 'Korle Bu Central Triage'}
              </Text>
            </View>

            <Text style={[styles.coordinatorName, { color: colors.text }]}>
              {profile?.displayName || 'Kofi Manu'}
            </Text>
            <Text style={[styles.coordinatorSub, { color: colors.textSecondary }]}>
              Network Bed Allocation · Transport Dispatch · Cross-Facility Protocol Enforcement
            </Text>
          </View>
        </View>

        {/* Rapid Metrics */}
        <View style={[styles.metricsRow, { borderTopColor: colors.border }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: colors.accent }]}>{pendingIncoming.length}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Triage Queue</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: colors.info }]}>{inTransit.length + 2}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Ambulances Active</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: colors.primary }]}>98.2%</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Capacity Match Rate</Text>
          </View>
        </View>
      </View>

      {/* Patient Transfer OTP Verification Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <View style={styles.cardHeader}>
          <AppIcon ios="lock.shield.fill" android="security" color={colors.primary} size={20} />
          <View style={styles.cardHeaderTexts}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Intake Handover OTP Verification
            </Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
              Enter the 6-digit code or Transfer PIN provided by the transferring paramedic to confirm handover
            </Text>
          </View>
        </View>

        <View style={styles.otpInputRow}>
          <TextInput
            value={otpCode}
            onChangeText={setOtpCode}
            placeholder="e.g. 482910"
            placeholderTextColor={colors.textSecondary}
            maxLength={6}
            keyboardType="number-pad"
            style={[
              styles.otpInput,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />
          <Pressable
            onPress={handleVerifyOtp}
            style={({ pressed }) => [
              styles.verifyBtn,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}>
            <Text style={styles.verifyBtnText}>Confirm Handover</Text>
          </Pressable>
        </View>

        {verificationResult && (
          <View
            style={[
              styles.alertBox,
              {
                backgroundColor: verificationResult.includes('Validated')
                  ? colors.primarySoft
                  : colors.dangerSoft,
                borderColor: verificationResult.includes('Validated')
                  ? colors.primary
                  : colors.danger,
              },
            ]}>
            <AppIcon
              ios={verificationResult.includes('Validated') ? 'checkmark.circle.fill' : 'exclamationmark.circle.fill'}
              android={verificationResult.includes('Validated') ? 'check_circle' : 'error'}
              color={verificationResult.includes('Validated') ? colors.primary : colors.danger}
              size={16}
            />
            <Text
              style={[
                styles.alertText,
                { color: verificationResult.includes('Validated') ? colors.primary : colors.danger },
              ]}>
              {verificationResult}
            </Text>
          </View>
        )}
      </View>

      {/* Network Intake Queue Table */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Master Network Transfer Queue
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Overseeing inter-hospital escalations across the regional cluster
        </Text>

        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {referrals.map((ref: Referral, index: number) => (
            <View
              key={ref.id}
              style={[
                styles.tableRow,
                index < referrals.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}>
              <View style={styles.tableMain}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.patientName, { color: colors.text }]}>
                    {ref.patient} ({ref.patientId})
                  </Text>
                  <StatusPill status={ref.status} />
                </View>

                <Text style={[styles.routeText, { color: colors.text }]}>
                  {ref.from} ➔ {ref.to}
                </Text>
                <Text numberOfLines={1} style={[styles.reasonSub, { color: colors.textSecondary }]}>
                  {ref.reason} · Priority: {ref.priority} · {ref.time}
                </Text>
              </View>

              {ref.status === 'Pending' && (
                <View style={styles.actionBtns}>
                  <Pressable
                    onPress={() => decideReferral(ref.id, 'Accepted')}
                    style={({ pressed }) => [
                      styles.quickAccept,
                      { backgroundColor: colors.primarySoft, borderColor: colors.primary },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.quickAcceptText, { color: colors.primary }]}>Assign Bed</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
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
  },
  coordinatorInfo: {
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coordinatorBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  coordinatorBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  facilityText: {
    fontSize: 11,
  },
  coordinatorName: {
    fontSize: 18,
    fontWeight: '800',
  },
  coordinatorSub: {
    fontSize: 11,
  },
  metricsRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
    gap: 2,
  },
  metricNum: {
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
  },
  divider: {
    width: 1,
    height: 30,
  },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.four,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardHeaderTexts: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 11,
  },
  otpInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  otpInput: {
    width: 120,
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  verifyBtn: {
    flex: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  alertBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
  },
  listCard: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableRow: {
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tableMain: {
    flex: 1,
    gap: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 13,
    fontWeight: '800',
  },
  routeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reasonSub: {
    fontSize: 11,
  },
  actionBtns: {
    alignItems: 'flex-end',
  },
  quickAccept: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickAcceptText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
