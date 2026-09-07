import { useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '@/context/auth-context';
import { Referral, useReferrals } from '@/context/referral-context';
import { isFirebaseConfigured } from '@/lib/firebase';
import { callVerifyOtp, getConfirmationRequestByReferral } from '@/lib/firestore';
import { RoleSwitcherBanner } from './role-switcher-banner';

export function SpecialistDashboard() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profile } = useAuth();
  const { referrals, decideReferral } = useReferrals();

  const [onCallStatus, setOnCallStatus] = useState<'On Call' | 'In Surgery' | 'Rounding'>('On Call');
  const selectedWard = 'Cardiology ICU Bay 2';

  const [pendingAccept, setPendingAccept] = useState<Referral | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const incomingPending = referrals.filter(
    (r: Referral) => r.direction === 'incoming' && r.status === 'Pending',
  );

  function handleAccept(referral: Referral) {
    setPendingAccept(referral);
    setOtpCode('');
    setOtpError(null);
    setOtpOpen(true);
  }

  async function submitOtp() {
    if (!pendingAccept) return;
    const trimmed = otpCode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setOtpError('Enter a valid 6-digit confirmation code or Transfer PIN.');
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      if (isFirebaseConfigured) {
        const isTransferPinMatch = pendingAccept.transferPin && trimmed === pendingAccept.transferPin;
        if (!isTransferPinMatch) {
          const req = await getConfirmationRequestByReferral(pendingAccept.id);
          if (!req) {
            setOtpError('No confirmation request found. Enter the verified Transfer PIN from the QR referral.');
            return;
          }
          const res = await callVerifyOtp(req.id, trimmed);
          if (!res.verified) {
            setOtpError('Incorrect confirmation code. Check SMS, email, or Transfer PIN.');
            return;
          }
        }
      }
      await decideReferral(pendingAccept.id, 'Accepted');
      setOtpOpen(false);
      setPendingAccept(null);
      setOtpCode('');
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleReject(id: string) {
    await decideReferral(id, 'Rejected');
  }

  return (
    <View style={styles.container}>
      <RoleSwitcherBanner />

      {/* Specialist On-Call Banner */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.heroTop}>
          <View style={styles.doctorInfo}>
            <View style={styles.badgeRow}>
              <View style={[styles.specialistBadge, { backgroundColor: '#F3E8FF' }]}>
                <AppIcon ios="heart.text.square.fill" android="local_hospital" color="#7E22CE" size={14} />
                <Text style={styles.specialistBadgeText}>Specialist & Receiving Consultant</Text>
              </View>
              <Text style={[styles.facilityText, { color: colors.textSecondary }]}>
                {profile?.facilityName || 'Korle Bu Teaching Hospital'}
              </Text>
            </View>

            <Text style={[styles.doctorName, { color: colors.text }]}>
              {profile?.displayName || 'Dr. Naa Lartey'}
            </Text>
            <Text style={[styles.doctorSub, { color: colors.textSecondary }]}>
              {profile?.jobTitle || 'Senior Consultant Cardiologist'} · Department of Medicine
            </Text>
          </View>

          {/* On-call status selector */}
          <View style={[styles.statusBox, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>MY CLINICAL STATUS</Text>
            <View style={styles.statusButtons}>
              {(['On Call', 'In Surgery', 'Rounding'] as const).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setOnCallStatus(s)}
                  style={[
                    styles.statusBtn,
                    onCallStatus === s && {
                      backgroundColor: s === 'On Call' ? colors.primary : colors.accent,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.statusBtnText,
                      { color: onCallStatus === s ? '#FFFFFF' : colors.textSecondary },
                      onCallStatus === s && { fontWeight: '800' },
                    ]}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Triage summary row */}
        <View style={[styles.triageRow, { borderTopColor: colors.border }]}>
          <View style={styles.triageStat}>
            <Text style={[styles.triageNum, { color: colors.danger }]}>{incomingPending.length}</Text>
            <Text style={[styles.triageLabel, { color: colors.textSecondary }]}>Pending Decisions</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.triageStat}>
            <Text style={[styles.triageNum, { color: colors.primary }]}>6</Text>
            <Text style={[styles.triageLabel, { color: colors.textSecondary }]}>Reserved Ward Beds</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.triageStat}>
            <Text style={[styles.triageNum, { color: colors.text }]}>9 Mins</Text>
            <Text style={[styles.triageLabel, { color: colors.textSecondary }]}>Avg Decision Time</Text>
          </View>
        </View>
      </View>

      {/* Pending Triage Queue */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Incoming Referrals Needing Specialist Acceptance
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Review clinical indications, allocate bed, and authorize ambulance transit
            </Text>
          </View>
        </View>

        {incomingPending.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppIcon ios="checkmark.circle.fill" android="check_circle" color={colors.primary} size={36} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>All Inflow Referrals Triaged</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              No incoming transfers currently waiting for your department.
            </Text>
          </View>
        ) : (
          <View style={styles.queueGap}>
            {incomingPending.map((ref: Referral) => (
              <View
                key={ref.id}
                style={[
                  styles.refCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={styles.refCardHeader}>
                  <View style={styles.refCardPatient}>
                    <Text style={[styles.patientName, { color: colors.text }]}>{ref.patient}</Text>
                    <Text style={[styles.patientMeta, { color: colors.textSecondary }]}>
                      ID: {ref.patientId} · From: {ref.from} · {ref.time}
                    </Text>
                  </View>
                  <View style={styles.refBadgeCol}>
                    <View
                      style={[
                        styles.priorityBadge,
                        {
                          backgroundColor:
                            ref.priority === 'Emergency' ? colors.dangerSoft : colors.accentSoft,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.priorityText,
                          {
                            color:
                              ref.priority === 'Emergency' ? colors.danger : colors.accent,
                          },
                        ]}>
                        {ref.priority} Priority
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Reason & Diagnostics */}
                <View style={[styles.clinicalBox, { backgroundColor: colors.backgroundElement }]}>
                  <Text style={[styles.clinicalLabel, { color: colors.textSecondary }]}>
                    CLINICAL PRESENTATION & REASON FOR ESCALATION:
                  </Text>
                  <Text style={[styles.clinicalReason, { color: colors.text }]}>{ref.reason}</Text>
                  <Text style={[styles.clinicalVitals, { color: colors.textSecondary }]}>
                    Referring Contact: {ref.contact} · ECG & ABG Transmitted
                  </Text>
                </View>

                {/* Ward allocation & Decision Actions */}
                <View style={styles.actionRow}>
                  <View style={styles.wardPicker}>
                    <Text style={[styles.wardLabel, { color: colors.textSecondary }]}>Target Ward:</Text>
                    <Text style={[styles.wardVal, { color: colors.primary }]}>{selectedWard}</Text>
                  </View>

                  <View style={styles.decisionBtns}>
                    <Pressable
                      onPress={() => handleReject(ref.id)}
                      style={({ pressed }) => [
                        styles.rejectBtn,
                        { borderColor: colors.border },
                        pressed && styles.pressed,
                      ]}>
                      <AppIcon ios="xmark" android="close" color={colors.danger} size={15} />
                      <Text style={[styles.rejectText, { color: colors.danger }]}>Decline</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleAccept(ref)}
                      style={({ pressed }) => [
                        styles.acceptBtn,
                        { backgroundColor: colors.primary },
                        pressed && styles.pressed,
                      ]}>
                      <AppIcon ios="checkmark" android="check" color="#FFFFFF" size={15} />
                      <Text style={styles.acceptText}>Accept Transfer & Reserve Bed</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* OTP Verification Modal */}
      <Modal visible={otpOpen} animationType="fade" transparent onRequestClose={() => setOtpOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppIcon ios="checkmark.shield.fill" android="verified_user" color={colors.primary} size={20} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Referral Acceptance</Text>
              </View>
              <Pressable
                accessibilityLabel="Close"
                onPress={() => setOtpOpen(false)}
                style={[styles.closeButton, { backgroundColor: colors.backgroundElement }]}>
                <AppIcon ios="xmark" android="close" color={colors.text} size={16} />
              </Pressable>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Enter the 6-digit confirmation code delivered via SMS/Email or the patient Transfer PIN from the QR referral payload.
            </Text>

            {otpError ? (
              <View style={[styles.otpErrorBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
                <AppIcon ios="exclamationmark.circle.fill" android="error" color={colors.danger} size={16} />
                <Text style={[styles.otpErrorText, { color: colors.danger }]}>{otpError}</Text>
              </View>
            ) : null}

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

            <View style={styles.modalActions}>
              <Pressable onPress={() => setOtpOpen(false)} style={[styles.modalCancelBtn, { borderColor: colors.border }]}>
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={submitOtp}
                disabled={otpLoading}
                style={({ pressed }) => [
                  styles.modalConfirmBtn,
                  { backgroundColor: colors.primary },
                  (pressed || otpLoading) && styles.pressed,
                ]}>
                {otpLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Verify & Accept</Text>
                )}
              </Pressable>
            </View>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  doctorInfo: {
    flex: 1,
    gap: 3,
    minWidth: 260,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specialistBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  specialistBadgeText: {
    color: '#7E22CE',
    fontSize: 10,
    fontWeight: '800',
  },
  facilityText: {
    fontSize: 11,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '800',
  },
  doctorSub: {
    fontSize: 11,
  },
  statusBox: {
    borderRadius: 8,
    padding: 8,
    gap: 6,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBtn: {
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBtnText: {
    fontSize: 10,
  },
  triageRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  triageStat: {
    alignItems: 'center',
    gap: 2,
  },
  triageNum: {
    fontSize: 20,
    fontWeight: '800',
  },
  triageLabel: {
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
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 11,
  },
  queueGap: {
    gap: 12,
  },
  refCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  refCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  refCardPatient: {
    flex: 1,
    gap: 2,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
  },
  patientMeta: {
    fontSize: 11,
  },
  refBadgeCol: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  clinicalBox: {
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  clinicalLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  clinicalReason: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  clinicalVitals: {
    fontSize: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  wardPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wardLabel: {
    fontSize: 11,
  },
  wardVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  decisionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rejectBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rejectText: {
    fontSize: 11,
    fontWeight: '700',
  },
  acceptBtn: {
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  acceptText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
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
    maxWidth: 440,
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  otpErrorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  otpInput: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
