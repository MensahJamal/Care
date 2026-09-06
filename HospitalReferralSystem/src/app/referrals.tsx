import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { Screen } from '@/components/ui/screen';
import { StatusPill } from '@/components/ui/status-pill';
import { Colors, Spacing } from '@/constants/theme';
import { Referral, ReferralDirection, useReferrals } from '@/context/referral-context';
import { isFirebaseConfigured } from '@/lib/firebase';
import { callVerifyOtp, getConfirmationRequestByReferral } from '@/lib/firestore';

export default function ReferralsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { referrals, decideReferral, addReferral } = useReferrals();
  const [direction, setDirection] = useState<ReferralDirection>('incoming');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Referral | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  // ── OTP acceptance state ──────────────────────────────────────────────────
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [pendingAccept, setPendingAccept] = useState<Referral | null>(null);

  const visible = useMemo(
    () =>
      referrals.filter(
        (referral) =>
          referral.direction === direction &&
          `${referral.patient} ${referral.id} ${referral.reason}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [direction, query, referrals],
  );

  /**
   * Called from ReferralModal's action buttons.
   * Reject is applied immediately; Accept opens the OTP verification modal.
   */
  const decide = (status: 'Accepted' | 'Rejected') => {
    if (!selected) return;
    if (status === 'Rejected') {
      decideReferral(selected.id, 'Rejected');
      setSelected({ ...selected, status: 'Rejected' });
      return;
    }
    // Accept requires OTP verification
    setPendingAccept(selected);
    setOtpCode('');
    setOtpError(null);
    setOtpOpen(true);
  };

  /**
   * Verifies the OTP entered by the clinician.
   * In Firebase mode: looks up the confirmationRequest linked to the referral,
   * calls verifyReferralOtp Cloud Function, then updates status directly.
   * In demo mode: accepts any syntactically valid 6-digit code and updates local state.
   */
  const submitOtp = async () => {
    if (!pendingAccept) return;
    const trimmedCode = otpCode.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      setOtpError('Enter a valid 6-digit confirmation code.');
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      if (isFirebaseConfigured) {
        const request = await getConfirmationRequestByReferral(pendingAccept.id);
        if (!request) {
          setOtpError('No confirmation request found for this referral. OTP verification is mandatory.');
          return;
        }
        const result = await callVerifyOtp(request.id, trimmedCode);
        if (!result.verified) {
          setOtpError('Incorrect code. Check the SMS or email sent to the referring facility.');
          return;
        }
      }
      await decideReferral(pendingAccept.id, 'Accepted');
      // Reflect acceptance in the open ReferralModal if it's the same referral
      setSelected((prev) => (prev?.id === pendingAccept.id ? { ...prev, status: 'Accepted' } : prev));
      setOtpOpen(false);
      setPendingAccept(null);
      setOtpCode('');
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <>
      <Screen
        title="Referrals"
        subtitle="Coordinate transfers across connected facilities"
        action={
          <Pressable
            onPress={() => setComposeOpen(true)}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}>
            <AppIcon ios="plus" android="add" color={colors.white} size={16} />
            <Text style={styles.primaryButtonText}>New referral</Text>
          </Pressable>
        }>
        <View style={styles.toolbar}>
          <View style={[styles.segment, { backgroundColor: colors.backgroundElement }]}>
            {(['incoming', 'sent'] as const).map((item) => {
              const count = referrals.filter((referral) => referral.direction === item).length;
              const active = direction === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => setDirection(item)}
                  style={[
                    styles.segmentButton,
                    active && { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  <Text
                    style={[
                      styles.segmentText,
                      { color: active ? colors.text : colors.textSecondary },
                      active && styles.segmentTextActive,
                    ]}>
                    {item === 'incoming' ? 'Incoming' : 'Sent'} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View
            style={[
              styles.search,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <AppIcon ios="magnifyingglass" android="search" color={colors.textSecondary} size={17} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search patient, ID or reason"
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>
        </View>

        <View style={styles.referralList}>
          {visible.map((referral) => (
            <Pressable
              key={referral.id}
              onPress={() => setSelected(referral)}
              style={({ pressed }) => [
                styles.referralCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.pressed,
              ]}>
              <View
                style={[
                  styles.priorityBar,
                  {
                    backgroundColor:
                      referral.priority === 'Emergency'
                        ? colors.danger
                        : referral.priority === 'Urgent'
                          ? colors.accent
                          : colors.info,
                  },
                ]}
              />
              <View style={styles.cardMain}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTitle}>
                    <Text style={[styles.patientName, { color: colors.text }]}>
                      {referral.patient}
                    </Text>
                    <Text style={[styles.patientId, { color: colors.textSecondary }]}>
                      {referral.patientId} · {referral.id}
                    </Text>
                  </View>
                  <StatusPill status={referral.status} />
                </View>
                <Text style={[styles.reason, { color: colors.text }]}>{referral.reason}</Text>
                <View style={styles.route}>
                  <View style={[styles.routeIcon, { backgroundColor: colors.backgroundElement }]}>
                    <AppIcon ios="cross.case" android="medical_services" color={colors.primary} size={15} />
                  </View>
                  <View style={styles.routeText}>
                    <Text style={[styles.routeLabel, { color: colors.textSecondary }]}>
                      {direction === 'incoming' ? 'From' : 'To'}
                    </Text>
                    <Text style={[styles.routeHospital, { color: colors.text }]}>
                      {direction === 'incoming' ? referral.from : referral.to}
                    </Text>
                  </View>
                  <Text style={[styles.time, { color: colors.textSecondary }]}>{referral.time}</Text>
                </View>
              </View>
              <AppIcon ios="chevron.right" android="arrow_forward" color={colors.textSecondary} size={18} />
            </Pressable>
          ))}
          {visible.length === 0 ? (
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <AppIcon ios="doc.text.magnifyingglass" android="search" color={colors.textSecondary} size={30} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No matching referrals</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Try another search or switch referral direction.
              </Text>
            </View>
          ) : null}
        </View>
      </Screen>

      <ReferralModal
        referral={selected}
        onClose={() => setSelected(null)}
        onDecide={decide}
      />
      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} addReferral={addReferral} referralCount={referrals.length} />
      <OtpModal
        open={otpOpen}
        referral={pendingAccept}
        code={otpCode}
        onChangeCode={setOtpCode}
        error={otpError}
        loading={otpLoading}
        onSubmit={submitOtp}
        onClose={() => {
          setOtpOpen(false);
          setPendingAccept(null);
          setOtpCode('');
          setOtpError(null);
        }}
      />
    </>
  );
}

// ─── Referral detail modal ────────────────────────────────────────────────────

function ReferralModal({
  referral,
  onClose,
  onDecide,
}: {
  referral: Referral | null;
  onClose: () => void;
  onDecide: (status: 'Accepted' | 'Rejected') => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  if (!referral) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalEyebrow, { color: colors.textSecondary }]}>
                REFERRAL {referral.id}
              </Text>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{referral.patient}</Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.backgroundElement }]}>
              <AppIcon ios="xmark" android="close" color={colors.text} size={17} />
            </Pressable>
          </View>
          <View style={[styles.detailPanel, { backgroundColor: colors.background }]}>
            <Detail label="Clinical reason" value={referral.reason} />
            <Detail label="Priority" value={referral.priority} />
            <Detail label="Sending facility" value={referral.from} />
            <Detail label="Contact" value={referral.contact} />
          </View>
          <View style={styles.modalStatus}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Current status</Text>
            <StatusPill status={referral.status} />
          </View>
          {referral.direction === 'incoming' && referral.status === 'Pending' ? (
            <View style={styles.decisionRow}>
              <Pressable
                onPress={() => onDecide('Rejected')}
                style={({ pressed }) => [
                  styles.decisionButton,
                  { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
                  pressed && styles.pressed,
                ]}>
                <AppIcon ios="xmark" android="close" color={colors.danger} size={17} />
                <Text style={[styles.decisionText, { color: colors.danger }]}>Reject</Text>
              </Pressable>
              <Pressable
                onPress={() => onDecide('Accepted')}
                style={({ pressed }) => [
                  styles.decisionButton,
                  { backgroundColor: colors.primary, borderColor: colors.primary },
                  pressed && styles.pressed,
                ]}>
                <AppIcon ios="checkmark.shield" android="verified_user" color={colors.white} size={17} />
                <Text style={styles.acceptText}>Accept & Verify</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

// ─── OTP verification modal ───────────────────────────────────────────────────

function OtpModal({
  open,
  referral,
  code,
  onChangeCode,
  error,
  loading,
  onSubmit,
  onClose,
}: {
  open: boolean;
  referral: Referral | null;
  code: string;
  onChangeCode: (code: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  if (!referral) return null;

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalEyebrow, { color: colors.textSecondary }]}>OTP VERIFICATION</Text>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm acceptance</Text>
            </View>
            <Pressable
              accessibilityLabel="Close OTP modal"
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.backgroundElement }]}>
              <AppIcon ios="xmark" android="close" color={colors.text} size={17} />
            </Pressable>
          </View>

          {/* Referral summary */}
          <View style={[styles.detailPanel, { backgroundColor: colors.background }]}>
            <Detail label="Patient" value={referral.patient} />
            <Detail label="Priority" value={referral.priority} />
            <Detail label="Referring facility" value={referral.from} />
          </View>

          {/* Instruction banner */}
          <View style={[styles.otpInfo, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
            <AppIcon
              ios="envelope.badge.shield.half.filled"
              android="mark_email_read"
              color={colors.primary}
              size={17}
            />
            <Text style={[styles.otpInfoText, { color: colors.primary }]}>
              {isFirebaseConfigured
                ? 'A 6-digit confirmation code was sent to the referring facility. Enter it below to confirm acceptance.'
                : 'Demo mode — enter any 6 digits to simulate OTP verification.'}
            </Text>
          </View>

          {/* Error alert */}
          {error ? (
            <View style={[styles.otpError, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
              <AppIcon ios="exclamationmark.circle.fill" android="error" color={colors.danger} size={16} />
              <Text style={[styles.otpErrorText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          {/* Code input */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Confirmation code</Text>
            <TextInput
              value={code}
              onChangeText={onChangeCode}
              placeholder="000000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              style={[
                styles.formInput,
                styles.otpInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: error ? colors.danger : colors.border,
                },
              ]}
            />
          </View>

          {/* Submit */}
          <Pressable
            disabled={loading}
            onPress={onSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              { backgroundColor: colors.primary },
              (pressed || loading) && styles.pressed,
            ]}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <AppIcon ios="checkmark.shield.fill" android="verified_user" color="#FFFFFF" size={17} />
                <Text style={styles.acceptText}>Verify & Accept Referral</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Shared detail row ────────────────────────────────────────────────────────

function Detail({ label, value }: { label: string; value: string }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <View style={styles.detail}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

// ─── Compose new referral modal ───────────────────────────────────────────────

const hospitalCategories = ['General', 'Specialist', 'Emergency', 'Maternal & Child'] as const;
type HospitalCategory = (typeof hospitalCategories)[number];

const hospitalsByCategory: Record<HospitalCategory, string[]> = {
  General: ['Ridge Hospital', 'Tema General Hospital'],
  Specialist: ['Korle Bu Teaching Hospital', '37 Military Hospital'],
  Emergency: ['Ridge Hospital', '37 Military Hospital'],
  'Maternal & Child': ['Princess Marie Louise Hospital', 'Ridge Hospital'],
};

function ComposeModal({
  open,
  onClose,
  addReferral,
  referralCount,
}: {
  open: boolean;
  onClose: () => void;
  addReferral: (input: Pick<Referral, 'patient' | 'reason' | 'priority' | 'to' | 'contact'>) => Promise<boolean>;
  referralCount: number;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [patient, setPatient] = useState('');
  const [reason, setReason] = useState('');
  const [hospital, setHospital] = useState('Ridge Hospital');
  const [hospitalMenuOpen, setHospitalMenuOpen] = useState(false);
  const [hospitalCategory, setHospitalCategory] = useState<HospitalCategory>('General');
  const [contact, setContact] = useState('');
  const [priority, setPriority] = useState<Referral['priority']>('Urgent');

  const submit = async () => {
    if (!patient.trim() || !reason.trim() || !hospital.trim() || !contact.trim()) {
      Alert.alert('Missing information', 'Enter the patient, clinical reason, hospital, and receiver contact.');
      return;
    }
    const isEmail = contact.includes('@');
    const isPhone = /^[+\d][\d\s().-]{6,}$/.test(contact.trim());
    if (!isEmail && !isPhone) {
      Alert.alert('Invalid contact', 'Enter a valid email address or phone number for the receiving hospital.');
      return;
    }
    const requestQueued = await addReferral({ patient, reason, to: hospital, contact, priority });
    Alert.alert(
      requestQueued ? 'Confirmation request sent' : 'Demo confirmation created',
      requestQueued
        ? `A ${isEmail ? 'email' : 'phone'} confirmation prompt was queued for ${contact.trim()}.`
        : 'The referral was added to local demo data. Configure Firebase to deliver confirmation requests.',
    );
    setPatient('');
    setReason('');
    setContact('');
    onClose();
  };

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalEyebrow, { color: colors.textSecondary }]}>NEW TRANSFER</Text>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create referral</Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.backgroundElement }]}>
              <AppIcon ios="xmark" android="close" color={colors.text} size={17} />
            </Pressable>
          </View>
          <FormField label="Patient name" value={patient} onChangeText={setPatient} placeholder="Full name" />
          <FormField label="Clinical reason" value={reason} onChangeText={setReason} placeholder="Diagnosis or reason for transfer" />
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Receiving hospital</Text>
            <View style={styles.hospitalPickerRow}>
              <TextInput
                value={hospital}
                onChangeText={setHospital}
                placeholder="Hospital name"
                placeholderTextColor={colors.textSecondary}
                style={[styles.formInput, styles.hospitalInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              />
              <Pressable
                accessibilityLabel="Choose receiving hospital"
                onPress={() => setHospitalMenuOpen((openState) => !openState)}
                style={({ pressed }) => [styles.dropdownButton, { backgroundColor: colors.backgroundElement, borderColor: colors.border }, pressed && styles.pressed]}>
                <AppIcon ios="chevron.down" android="arrow_drop_down" color={colors.text} size={18} />
              </Pressable>
            </View>
            {hospitalMenuOpen ? (
              <View style={[styles.hospitalMenu, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.categoryRow}>
                  {hospitalCategories.map((category) => (
                    <Pressable
                      key={category}
                      onPress={() => setHospitalCategory(category)}
                      style={[styles.categoryButton, { backgroundColor: hospitalCategory === category ? colors.primarySoft : colors.backgroundElement, borderColor: hospitalCategory === category ? colors.primary : colors.border }]}>
                      <Text style={[styles.categoryText, { color: hospitalCategory === category ? colors.primary : colors.textSecondary }]}>{category}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.hospitalOptions}>
                  {hospitalsByCategory[hospitalCategory].map((option) => (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setHospital(option);
                        setHospitalMenuOpen(false);
                      }}
                      style={({ pressed }) => [styles.hospitalOption, { borderBottomColor: colors.border }, pressed && styles.pressed]}>
                      <AppIcon ios="building.2" android="local_hospital" color={colors.primary} size={16} />
                      <Text style={[styles.hospitalOptionText, { color: colors.text }]}>{option}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
          <FormField label="Email or phone" value={contact} onChangeText={setContact} placeholder="Receiver contact" />
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Priority</Text>
            <View style={styles.priorityOptions}>
              {(['Routine', 'Urgent', 'Emergency'] as const).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setPriority(item)}
                  style={[
                    styles.priorityOption,
                    {
                      backgroundColor:
                        priority === item ? colors.primarySoft : colors.backgroundElement,
                      borderColor: priority === item ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.priorityOptionText,
                      { color: priority === item ? colors.primary : colors.textSecondary },
                    ]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable
            onPress={submit}
            style={({ pressed }) => [
              styles.submitButton,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}>
            <AppIcon ios="paperplane.fill" android="arrow_forward" color={colors.white} size={17} />
            <Text style={styles.acceptText}>Send referral</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <View style={styles.formGroup}>
      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.formInput,
          { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    height: 40,
    borderRadius: 7,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  toolbar: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  segment: { height: 42, borderRadius: 7, padding: 3, flexDirection: 'row' },
  segmentButton: {
    minWidth: 96,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: { fontSize: 11, fontWeight: '600' },
  segmentTextActive: { fontWeight: '800' },
  search: {
    flex: 1,
    height: 42,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, height: '100%', fontSize: 12 },
  referralList: { gap: Spacing.three },
  referralCard: {
    minHeight: 132,
    borderRadius: 8,
    borderWidth: 1,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  priorityBar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  cardMain: { flex: 1, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardTitle: { gap: 2 },
  patientName: { fontSize: 15, fontWeight: '800' },
  patientId: { fontSize: 9 },
  reason: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
  route: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeText: { flex: 1 },
  routeLabel: { fontSize: 8 },
  routeHospital: { fontSize: 10, fontWeight: '700' },
  time: { fontSize: 9 },
  empty: { minHeight: 210, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: '800', marginTop: 5 },
  emptyText: { fontSize: 11 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 19, 16, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 8,
    padding: 20,
    gap: 15,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalEyebrow: { fontSize: 9, fontWeight: '800' },
  modalTitle: { fontSize: 21, fontWeight: '800', marginTop: 2 },
  closeButton: { width: 34, height: 34, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  detailPanel: { borderRadius: 7, padding: 14, gap: 13 },
  detail: { gap: 3 },
  detailLabel: { fontSize: 9, fontWeight: '700' },
  detailValue: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
  modalStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  decisionRow: { flexDirection: 'row', gap: 10 },
  decisionButton: {
    flex: 1,
    height: 44,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  decisionText: { fontSize: 12, fontWeight: '800' },
  acceptText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  // OTP modal
  otpInfo: {
    borderRadius: 7,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  otpInfoText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '600' },
  otpError: {
    borderRadius: 7,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  otpErrorText: { flex: 1, fontSize: 11, lineHeight: 15, fontWeight: '600' },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 8,
  },
  // Shared form styles
  formGroup: { gap: 6 },
  formLabel: { fontSize: 10, fontWeight: '700' },
  formInput: { height: 42, borderRadius: 6, borderWidth: 1, paddingHorizontal: 12, fontSize: 12 },
  hospitalPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hospitalInput: { flex: 1 },
  dropdownButton: { width: 46, height: 42, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hospitalMenu: { borderRadius: 6, borderWidth: 1, padding: 8, gap: 8 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoryButton: { minHeight: 30, borderRadius: 5, borderWidth: 1, paddingHorizontal: 8, justifyContent: 'center' },
  categoryText: { fontSize: 9, fontWeight: '800' },
  hospitalOptions: { gap: 2 },
  hospitalOption: { minHeight: 38, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  hospitalOptionText: { fontSize: 11, fontWeight: '700' },
  priorityOptions: { flexDirection: 'row', gap: 8 },
  priorityOption: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityOptionText: { fontSize: 10, fontWeight: '800' },
  submitButton: {
    height: 44,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 3,
  },
  pressed: { opacity: 0.65 },
});
