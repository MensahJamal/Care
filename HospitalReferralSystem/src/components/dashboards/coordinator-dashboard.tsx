import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
  const { referrals, decideReferral, confirmHandover } = useReferrals();

  // Active inbound cases eligible for physical intake handover
  const inboundCandidates = useMemo(
    () => referrals.filter((r: Referral) => r.status === 'In transit' || r.status === 'Accepted'),
    [referrals],
  );

  const pendingIncoming = referrals.filter((r: Referral) => r.status === 'Pending');
  const inTransit = referrals.filter((r: Referral) => r.status === 'In transit');
  const arrivedCases = referrals.filter((r: Referral) => r.status === 'Arrived');

  // Selected referral for intake handover
  const [selectedReferralId, setSelectedReferralId] = useState<string>(() => {
    return inboundCandidates[0]?.id || '';
  });

  // If selectedReferralId is empty or not in candidates, default to first candidate if available
  const activeReferral = useMemo(() => {
    return referrals.find((r) => r.id === selectedReferralId) || inboundCandidates[0] || null;
  }, [referrals, selectedReferralId, inboundCandidates]);

  // Handover form state
  const [otpCode, setOtpCode] = useState('');
  const [paramedicName, setParamedicName] = useState('Sarah Annan (Paramedic)');
  const [ambulanceId, setAmbulanceId] = useState('AMB-04');
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [pulseRate, setPulseRate] = useState('78');
  const [spo2, setSpo2] = useState('98');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [handoverSuccess, setHandoverSuccess] = useState<{
    referral: Referral;
    timestamp: string;
  } | null>(null);

  // Update paramedic/ambulance when active referral changes
  function selectReferralForHandover(ref: Referral) {
    setSelectedReferralId(ref.id);
    if (ref.paramedicName) setParamedicName(ref.paramedicName);
    if (ref.ambulanceId) setAmbulanceId(ref.ambulanceId);
    setOtpCode('');
    setErrorMessage(null);
    setHandoverSuccess(null);
  }

  async function handleConfirmHandover() {
    if (!activeReferral) {
      setErrorMessage('Please select an active inbound referral from the intake queue.');
      return;
    }

    const trimmedOtp = otpCode.trim();
    if (!/^\d{6}$/.test(trimmedOtp)) {
      setErrorMessage('Please enter a valid 6-digit numeric Transfer PIN or OTP.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await confirmHandover(activeReferral.id, trimmedOtp, {
        paramedicName: paramedicName.trim() || 'Sarah Annan (Paramedic)',
        ambulanceId: ambulanceId.trim() || 'AMB-04',
        arrivalVitals: {
          bloodPressure: bloodPressure.trim() || '120/80',
          pulseRate: Number(pulseRate) || 78,
          spo2: Number(spo2) || 98,
        },
      });

      if (result.success) {
        setHandoverSuccess({
          referral: {
            ...activeReferral,
            status: 'Arrived',
            paramedicName: paramedicName.trim() || 'Sarah Annan (Paramedic)',
            ambulanceId: ambulanceId.trim() || 'AMB-04',
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setOtpCode('');
      } else {
        setErrorMessage(result.error || 'Verification failed. Please check the code and try again.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Handover verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAutofillPin() {
    if (activeReferral?.transferPin) {
      setOtpCode(activeReferral.transferPin);
      setErrorMessage(null);
    } else {
      setOtpCode('829104');
      setErrorMessage(null);
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
              Emergency Bay Handover · Chain of Custody Enforcement · Regional Bed Allocation
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
            <Text style={[styles.metricNum, { color: colors.info }]}>{inTransit.length}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Ambulances En Route</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: '#15803D' }]}>{arrivedCases.length}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Handovers Completed</Text>
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
          <View style={[styles.cardHeaderIconWrap, { backgroundColor: colors.primarySoft }]}>
            <AppIcon ios="lock.shield.fill" android="security" color={colors.primary} size={22} />
          </View>
          <View style={styles.cardHeaderTexts}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Emergency Intake Handover Station
            </Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
              Two-party verification protocol: confirm custody transfer with the transferring paramedic via 6-digit PIN
            </Text>
          </View>
        </View>

        {/* Case Selector Chips */}
        {inboundCandidates.length > 0 ? (
          <View style={styles.candidateSelectorArea}>
            <Text style={[styles.fieldSectionLabel, { color: colors.textSecondary }]}>
              Select Inbound Ambulance Case:
            </Text>
            <View style={styles.chipsRow}>
              {inboundCandidates.map((cand) => {
                const isSelected = activeReferral?.id === cand.id;
                return (
                  <Pressable
                    key={cand.id}
                    onPress={() => selectReferralForHandover(cand)}
                    style={[
                      styles.candidateChip,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primarySoft : colors.background,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '800' : '600' },
                      ]}>
                      {cand.id} · {cand.patient}
                    </Text>
                    <StatusPill status={cand.status} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={[styles.emptyNoticeBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <AppIcon ios="info.circle" android="info" color={colors.textSecondary} size={16} />
            <Text style={[styles.emptyNoticeText, { color: colors.textSecondary }]}>
              No transfers currently in transit. Handovers require an active or in-transit referral.
            </Text>
          </View>
        )}

        {/* Active Selected Referral Preview Banner */}
        {activeReferral && (
          <View style={[styles.patientBanner, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.patientBannerTop}>
              <View style={styles.patientBannerNameGroup}>
                <Text style={[styles.patientBannerName, { color: colors.text }]}>
                  {activeReferral.patient} ({activeReferral.patientId})
                </Text>
                <Text style={[styles.patientBannerRoute, { color: colors.textSecondary }]}>
                  {activeReferral.from} ➔ {activeReferral.to}
                </Text>
              </View>
              <View style={[styles.priorityPill, { backgroundColor: '#FEE2E2' }]}>
                <Text style={styles.priorityPillText}>{activeReferral.priority}</Text>
              </View>
            </View>
            <Text style={[styles.patientBannerReason, { color: colors.text }]}>
              Condition: {activeReferral.reason}
            </Text>
          </View>
        )}

        {/* Verification Form (or Success Receipt) */}
        {handoverSuccess ? (
          <View style={[styles.receiptContainer, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
            <View style={styles.receiptHeader}>
              <AppIcon ios="checkmark.seal.fill" android="verified" color="#15803D" size={26} />
              <View style={styles.receiptTitleGroup}>
                <Text style={styles.receiptTitle}>PATIENT CUSTODY HANDOVER CONFIRMED</Text>
                <Text style={styles.receiptSub}>Cryptographic Two-Party Handshake Verified</Text>
              </View>
            </View>

            <View style={styles.receiptDetailsGrid}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptKey}>Referral & Patient:</Text>
                <Text style={styles.receiptVal}>
                  {handoverSuccess.referral.id} · {handoverSuccess.referral.patient}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptKey}>Receiving Officer:</Text>
                <Text style={styles.receiptVal}>
                  {profile?.displayName || 'Kofi Manu'} ({profile?.facilityName || 'KBTH Central Triage'})
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptKey}>Transferring Crew:</Text>
                <Text style={styles.receiptVal}>
                  {handoverSuccess.referral.paramedicName || paramedicName} · Unit {handoverSuccess.referral.ambulanceId || ambulanceId}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptKey}>Arrival Vitals:</Text>
                <Text style={styles.receiptVal}>
                  BP {bloodPressure} mmHg · SpO2 {spo2}% · Pulse {pulseRate} bpm
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptKey}>Handover Time:</Text>
                <Text style={styles.receiptVal}>{handoverSuccess.timestamp} (Authenticated)</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptKey}>Status Transition:</Text>
                <Text style={[styles.receiptVal, { color: '#15803D', fontWeight: '800' }]}>
                  In Transit ➔ ARRIVED (Custody Accepted)
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setHandoverSuccess(null)}
              style={({ pressed }) => [
                styles.resetBtn,
                { backgroundColor: '#15803D' },
                pressed && styles.pressed,
              ]}>
              <Text style={styles.resetBtnText}>Process Next Inbound Patient</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.formContainer}>
            {/* PIN Input & Autofill */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  6-Digit Transfer PIN / OTP <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <Pressable onPress={handleAutofillPin} style={styles.autofillBtn}>
                  <Text style={[styles.autofillText, { color: colors.primary }]}>
                    Autofill PIN ({activeReferral?.transferPin || '829104'})
                  </Text>
                </Pressable>
              </View>

              <View style={styles.otpInputRow}>
                <TextInput
                  value={otpCode}
                  onChangeText={(val) => {
                    setOtpCode(val.replace(/\D/g, ''));
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. 829104"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={6}
                  keyboardType="number-pad"
                  style={[
                    styles.otpInput,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                />
                <Pressable
                  disabled={isSubmitting || !activeReferral}
                  onPress={handleConfirmHandover}
                  style={({ pressed }) => [
                    styles.verifyBtn,
                    {
                      backgroundColor: !activeReferral ? colors.border : colors.primary,
                      opacity: isSubmitting ? 0.7 : 1,
                    },
                    pressed && styles.pressed,
                  ]}>
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.verifyBtnText}>Confirm Handover</Text>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Paramedic & Transport Metadata Row */}
            <View style={styles.metaInputsRow}>
              <View style={styles.metaField}>
                <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                  Transferring Paramedic:
                </Text>
                <TextInput
                  value={paramedicName}
                  onChangeText={setParamedicName}
                  placeholder="Paramedic Name"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.compactInput,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                />
              </View>

              <View style={styles.metaField}>
                <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                  Ambulance / Unit ID:
                </Text>
                <TextInput
                  value={ambulanceId}
                  onChangeText={setAmbulanceId}
                  placeholder="e.g. AMB-04"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.compactInput,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                />
              </View>
            </View>

            {/* Arrival Triage Vitals Row */}
            <View style={styles.vitalsRow}>
              <View style={styles.vitalItem}>
                <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>Blood Pressure:</Text>
                <TextInput
                  value={bloodPressure}
                  onChangeText={setBloodPressure}
                  placeholder="120/80"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.vitalInput,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                />
              </View>

              <View style={styles.vitalItem}>
                <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>SpO2 (%):</Text>
                <TextInput
                  value={spo2}
                  onChangeText={setSpo2}
                  placeholder="98"
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.vitalInput,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                />
              </View>

              <View style={styles.vitalItem}>
                <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>Pulse (bpm):</Text>
                <TextInput
                  value={pulseRate}
                  onChangeText={setPulseRate}
                  placeholder="78"
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.vitalInput,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                />
              </View>
            </View>

            {errorMessage && (
              <View style={[styles.alertBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
                <AppIcon ios="exclamationmark.circle.fill" android="error" color={colors.danger} size={16} />
                <Text style={[styles.alertText, { color: colors.danger }]}>{errorMessage}</Text>
              </View>
            )}
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
          {referrals.map((ref: Referral, index: number) => {
            const isTarget = activeReferral?.id === ref.id;
            return (
              <View
                key={ref.id}
                style={[
                  styles.tableRow,
                  index < referrals.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  isTarget && { backgroundColor: colors.primarySoft + '15' },
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

                  {ref.status === 'Arrived' && ref.handoverAt && (
                    <Text style={[styles.handoverStamp, { color: '#15803D' }]}>
                      ✓ Handover complete at {ref.handoverAt} · Handed to {ref.handoverByName || 'Intake Officer'}
                    </Text>
                  )}
                </View>

                {/* Contextual Action Buttons */}
                <View style={styles.actionBtns}>
                  {ref.status === 'Pending' && (
                    <Pressable
                      onPress={() => decideReferral(ref.id, 'Accepted')}
                      style={({ pressed }) => [
                        styles.quickAccept,
                        { backgroundColor: colors.primarySoft, borderColor: colors.primary },
                        pressed && styles.pressed,
                      ]}>
                      <Text style={[styles.quickAcceptText, { color: colors.primary }]}>Assign Bed</Text>
                    </Pressable>
                  )}

                  {(ref.status === 'In transit' || ref.status === 'Accepted') && (
                    <Pressable
                      onPress={() => selectReferralForHandover(ref)}
                      style={({ pressed }) => [
                        styles.quickAccept,
                        {
                          backgroundColor: isTarget ? colors.primary : '#FEF3C7',
                          borderColor: isTarget ? colors.primary : '#F59E0B',
                        },
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        style={[
                          styles.quickAcceptText,
                          { color: isTarget ? '#FFFFFF' : '#92400E' },
                        ]}>
                        {isTarget ? 'Selected' : 'Intake Handover'}
                      </Text>
                    </Pressable>
                  )}

                  {ref.status === 'Arrived' && (
                    <View style={styles.arrivedBadge}>
                      <AppIcon ios="checkmark.circle.fill" android="check_circle" color="#15803D" size={16} />
                      <Text style={styles.arrivedBadgeText}>Received</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
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
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTexts: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  candidateSelectorArea: {
    gap: 6,
  },
  fieldSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  candidateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
  },
  emptyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  emptyNoticeText: {
    fontSize: 11,
    flex: 1,
  },
  patientBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  patientBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientBannerNameGroup: {
    gap: 2,
  },
  patientBannerName: {
    fontSize: 13,
    fontWeight: '800',
  },
  patientBannerRoute: {
    fontSize: 11,
  },
  priorityPill: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  patientBannerReason: {
    fontSize: 12,
    fontWeight: '600',
  },
  formContainer: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  autofillBtn: {
    paddingVertical: 2,
  },
  autofillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  otpInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  otpInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
  },
  verifyBtn: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    height: 42,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  metaInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaField: {
    flex: 1,
    gap: 4,
  },
  inputSubLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  compactInput: {
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 12,
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  vitalItem: {
    flex: 1,
    gap: 4,
  },
  vitalInput: {
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 12,
    textAlign: 'center',
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
  receiptContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 12,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  receiptTitleGroup: {
    flex: 1,
  },
  receiptTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  receiptSub: {
    fontSize: 11,
    color: '#166534',
  },
  receiptDetailsGrid: {
    gap: 6,
    paddingVertical: 4,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptKey: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  receiptVal: {
    fontSize: 11,
    color: '#14532D',
    fontWeight: '700',
  },
  resetBtn: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
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
  handoverStamp: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
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
  arrivedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  arrivedBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
