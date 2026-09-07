import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { AppIcon } from '@/components/ui/app-icon';
import { Screen } from '@/components/ui/screen';
import { StatusPill } from '@/components/ui/status-pill';
import { Colors, Spacing } from '@/constants/theme';
import { Referral, ReferralDirection, useReferrals } from '@/context/referral-context';
import { useAuth } from '@/context/auth-context';
import { AppRole, ROLE_DEFINITIONS, canAccessReferrals, isSystemAdminRole } from '@/constants/roles';
import { isFirebaseConfigured } from '@/lib/firebase';
import { callVerifyOtp, getConfirmationRequestByReferral } from '@/lib/firestore';

export type ReferralQRPayload = {
  type: 'hospital_referral';
  version: '1.0';
  id: string;
  patient: string;
  patientId: string;
  reason: string;
  priority: 'Emergency' | 'Urgent' | 'Routine';
  from: string;
  to: string;
  fromFacilityId?: string;
  contact: string;
  transferPin?: string;
  createdAt: string;
};

const NETWORK_FACILITIES = [
  { id: 'ALL', name: 'All Facilities (Nationwide)' },
  { id: 'Korle Bu Teaching Hospital', name: 'Korle Bu' },
  { id: 'Ridge Hospital', name: 'Ridge Hospital' },
  { id: '37 Military Hospital', name: '37 Military' },
  { id: 'Tema General Hospital', name: 'Tema General' },
];

export default function ReferralsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { referrals, decideReferral, addReferral, receiveReferral } = useReferrals();
  const { profile, signIn } = useAuth();
  const [direction, setDirection] = useState<ReferralDirection>('incoming');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Referral | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  // ── Role Authorization & Oversight ───────────────────────────────────────
  const currentRole = (profile?.role as AppRole) || 'specialist';
  const isAuthorized = canAccessReferrals(currentRole);
  const isSystemAdmin = isSystemAdminRole(currentRole);
  const isHospitalAdmin = currentRole === 'hospital_admin';
  const [selectedFacility, setSelectedFacility] = useState<string>('ALL');

  // ── QR code referral states ───────────────────────────────────────────────
  const [generatedQr, setGeneratedQr] = useState<ReferralQRPayload | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scannedReferral, setScannedReferral] = useState<ReferralQRPayload | null>(null);

  // ── OTP acceptance state ──────────────────────────────────────────────────
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [pendingAccept, setPendingAccept] = useState<Referral | null>(null);

  const visible = useMemo(
    () =>
      referrals.filter((referral) => {
        const matchesDirection = referral.direction === direction;
        const matchesQuery = `${referral.patient} ${referral.id} ${referral.reason} ${referral.from} ${referral.to}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesFacility =
          !isSystemAdmin || selectedFacility === 'ALL'
            ? true
            : referral.from.includes(selectedFacility) ||
              referral.to.includes(selectedFacility) ||
              referral.fromFacilityId === selectedFacility ||
              referral.toFacilityId === selectedFacility;
        return matchesDirection && matchesQuery && matchesFacility;
      }),
    [direction, query, referrals, isSystemAdmin, selectedFacility],
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
        // Fast-path: Transfer PIN match from offline handover card
        const isTransferPinMatch = pendingAccept.transferPin && trimmedCode === pendingAccept.transferPin;
        if (!isTransferPinMatch) {
          const request = await getConfirmationRequestByReferral(pendingAccept.id);
          if (!request) {
            setOtpError('No confirmation request found. Enter the verified Transfer PIN from the QR referral.');
            return;
          }
          const result = await callVerifyOtp(request.id, trimmedCode);
          if (!result.verified) {
            setOtpError('Incorrect code. Check the SMS, email, or Transfer PIN.');
            return;
          }
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

  if (!isAuthorized) {
    return (
      <RestrictedReferralAccessScreen
        currentRole={currentRole}
        userFacility={profile?.facilityName || 'Assigned Facility'}
        onSwitchRole={async (role) => {
          const creds = ROLE_DEFINITIONS[role].demoCredentials;
          await signIn(creds.email, 'demo1234');
        }}
      />
    );
  }

  return (
    <>
      <Screen
        title="Referrals"
        subtitle={
          isSystemAdmin
            ? 'National Network Oversight · System Administrator'
            : isHospitalAdmin
              ? `Hospital Administration · ${profile?.facilityName || 'Your Facility'}`
              : `Specialist Clinical Triage · ${profile?.facilityName || 'Your Facility'}`
        }
        action={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setScanOpen(true)}
              style={({ pressed }) => [
                styles.secondaryHeaderButton,
                { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                pressed && styles.pressed,
              ]}>
              <AppIcon ios="qrcode.viewfinder" android="qr_code_scanner" color={colors.text} size={16} />
              <Text style={[styles.secondaryHeaderButtonText, { color: colors.text }]}>Scan QR</Text>
            </Pressable>
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
          </View>
        }>
        {/* Role Scope & Oversight Header */}
        {isSystemAdmin ? (
          <View style={[styles.oversightBanner, { backgroundColor: colors.surface, borderColor: colors.danger }]}>
            <View style={styles.oversightHeader}>
              <View style={[styles.oversightIconBox, { backgroundColor: colors.dangerSoft }]}>
                <AppIcon ios="shield.lefthalf.filled" android="admin_panel_settings" color={colors.danger} size={18} />
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.oversightTitle, { color: colors.text }]}>Network-Wide Oversight</Text>
                  <View style={[styles.oversightPill, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
                    <Text style={[styles.oversightPillText, { color: colors.danger }]}>Super Admin</Text>
                  </View>
                </View>
                <Text style={[styles.oversightSub, { color: colors.textSecondary }]}>
                  Overseeing all incoming and outgoing referrals across connected hospitals
                </Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.facilityFilterScroll}>
              {NETWORK_FACILITIES.map((facility) => {
                const active = selectedFacility === facility.id;
                return (
                  <Pressable
                    key={facility.id}
                    onPress={() => setSelectedFacility(facility.id)}
                    style={[
                      styles.facilityChip,
                      {
                        backgroundColor: active ? colors.danger : colors.backgroundElement,
                        borderColor: active ? colors.danger : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.facilityChipText,
                        { color: active ? '#FFFFFF' : colors.text },
                      ]}>
                      {facility.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : isHospitalAdmin ? (
          <View style={[styles.roleScopeBanner, { backgroundColor: colors.infoSoft, borderColor: colors.info }]}>
            <AppIcon ios="building.2.fill" android="domain" color={colors.info} size={17} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.roleScopeTitle, { color: colors.info }]}>Hospital Administrator Queue</Text>
              <Text style={[styles.roleScopeSub, { color: colors.textSecondary }]}>
                Managing patient referrals for {profile?.facilityName || 'your facility'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.roleScopeBanner, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
            <AppIcon ios="heart.text.square.fill" android="local_hospital" color={colors.primary} size={17} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.roleScopeTitle, { color: colors.primary }]}>Specialist Clinical Triage</Text>
              <Text style={[styles.roleScopeSub, { color: colors.textSecondary }]}>
                Reviewing, issuing, and deciding transfers for {profile?.facilityName || 'your facility'}
              </Text>
            </View>
          </View>
        )}
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
      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        addReferral={addReferral}
        referralCount={referrals.length}
        onGenerateQr={(payload) => setGeneratedQr(payload)}
      />
      <GeneratedQrModal
        visible={Boolean(generatedQr)}
        payload={generatedQr}
        onClose={() => setGeneratedQr(null)}
        onSimulateScan={(payload) => {
          setGeneratedQr(null);
          setScannedReferral(payload);
        }}
      />
      <ScanQrModal
        visible={scanOpen}
        onClose={() => setScanOpen(false)}
        onScanned={(payload) => {
          setScanOpen(false);
          setScannedReferral(payload);
        }}
        lastGenerated={generatedQr}
      />
      <ReviewScannedReferralModal
        visible={Boolean(scannedReferral)}
        referral={scannedReferral}
        onClose={() => setScannedReferral(null)}
        onAccept={async () => {
          if (!scannedReferral) return;
          await receiveReferral({
            id: scannedReferral.id,
            patient: scannedReferral.patient,
            patientId: scannedReferral.patientId,
            reason: scannedReferral.reason,
            priority: scannedReferral.priority,
            from: scannedReferral.from,
            to: scannedReferral.to,
            contact: scannedReferral.contact,
            transferPin: scannedReferral.transferPin,
            status: 'Accepted',
            direction: 'incoming',
          });
          setDirection('incoming');
          setScannedReferral(null);
          Alert.alert(
            'Referral Accepted',
            `Transfer for ${scannedReferral.patient} has been accepted into your facility.`,
          );
        }}
        onReject={async () => {
          if (!scannedReferral) return;
          await receiveReferral({
            id: scannedReferral.id,
            patient: scannedReferral.patient,
            patientId: scannedReferral.patientId,
            reason: scannedReferral.reason,
            priority: scannedReferral.priority,
            from: scannedReferral.from,
            to: scannedReferral.to,
            contact: scannedReferral.contact,
            transferPin: scannedReferral.transferPin,
            status: 'Rejected',
            direction: 'incoming',
          });
          setScannedReferral(null);
          Alert.alert(
            'Referral Rejected',
            `Transfer request for ${scannedReferral.patient} was rejected.`,
          );
        }}
      />
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
            <Detail
              label="Transfer Security PIN"
              value={referral.transferPin ? `${referral.transferPin} (Verified)` : '123456 (Demo Handover)'}
            />
          </View>

          {/* Instruction banner */}
          <View style={[styles.otpInfo, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
            <AppIcon
              ios="lock.shield.fill"
              android="security"
              color={colors.primary}
              size={17}
            />
            <Text style={[styles.otpInfoText, { color: colors.primary }]}>
              {isFirebaseConfigured
                ? 'Enter the 6-digit confirmation code or use the offline Transfer Security PIN from the QR referral card.'
                : 'Offline Handover Protocol ($0 Cost): Enter the 6-digit Security PIN from the QR card or tap Autofill.'}
            </Text>
          </View>

          {/* Error alert */}
          {error ? (
            <View style={[styles.otpError, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
              <AppIcon ios="exclamationmark.circle.fill" android="error" color={colors.danger} size={16} />
              <Text style={[styles.otpErrorText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          {/* Code input with Autofill */}
          <View style={styles.formGroup}>
            <View style={styles.otpLabelRow}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Confirmation code</Text>
              <Pressable
                onPress={() => onChangeCode(referral.transferPin || '123456')}
                style={({ pressed }) => [
                  styles.autofillButton,
                  { backgroundColor: colors.primarySoft, borderColor: colors.primary },
                  pressed && styles.pressed,
                ]}>
                <AppIcon ios="bolt.fill" android="flash_on" color={colors.primary} size={13} />
                <Text style={[styles.autofillButtonText, { color: colors.primary }]}>
                  Autofill PIN ({referral.transferPin || '123456'})
                </Text>
              </Pressable>
            </View>
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
  onGenerateQr,
}: {
  open: boolean;
  onClose: () => void;
  addReferral: (input: Pick<Referral, 'patient' | 'reason' | 'priority' | 'to' | 'contact'>) => Promise<boolean>;
  referralCount: number;
  onGenerateQr: (payload: ReferralQRPayload) => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profile } = useAuth();
  const [patient, setPatient] = useState('');
  const [reason, setReason] = useState('');
  const [hospital, setHospital] = useState('Ridge Hospital');
  const [hospitalMenuOpen, setHospitalMenuOpen] = useState(false);
  const [hospitalCategory, setHospitalCategory] = useState<HospitalCategory>('General');
  const [contact, setContact] = useState('');
  const [priority, setPriority] = useState<Referral['priority']>('Urgent');

  const generateQr = async () => {
    if (!patient.trim() || !reason.trim() || !hospital.trim()) {
      Alert.alert('Missing information', 'Enter the patient name, clinical reason, and hospital to send the referral to.');
      return;
    }
    const fromFacility = profile?.facilityName ?? 'Korle Bu Teaching Hospital';
    const fromFacilityId = profile?.facilityId ?? 'KBTH-01';
    const uniqueSuffix = `${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    const effectiveContact = contact.trim() || '+233 30 266 5400';
    const transferPin = String(Math.floor(100000 + Math.random() * 900000));

    const payload: ReferralQRPayload = {
      type: 'hospital_referral',
      version: '1.0',
      id: `RF-${uniqueSuffix}`,
      patient: patient.trim(),
      patientId: `PT-${uniqueSuffix}`,
      reason: reason.trim(),
      priority,
      from: fromFacility,
      to: hospital.trim(),
      fromFacilityId,
      contact: effectiveContact,
      transferPin,
      createdAt: new Date().toISOString(),
    };

    // Save as sent referral in sender records
    await addReferral({
      patient: payload.patient,
      reason: payload.reason,
      priority: payload.priority,
      to: payload.to,
      contact: payload.contact,
    });

    setPatient('');
    setReason('');
    setContact('');
    onClose();
    onGenerateQr(payload);
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
            onPress={generateQr}
            style={({ pressed }) => [
              styles.submitButton,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}>
            <AppIcon ios="qrcode" android="qr_code" color={colors.white} size={18} />
            <Text style={styles.acceptText}>Generate QR code</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Generated QR code presentation modal ──────────────────────────────────────

function GeneratedQrModal({
  visible,
  payload,
  onClose,
  onSimulateScan,
}: {
  visible: boolean;
  payload: ReferralQRPayload | null;
  onClose: () => void;
  onSimulateScan: (payload: ReferralQRPayload) => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  if (!payload) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalEyebrow, { color: colors.textSecondary }]}>REFERRAL QR CODE</Text>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Transfer Code</Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.backgroundElement }]}>
              <AppIcon ios="xmark" android="close" color={colors.text} size={17} />
            </Pressable>
          </View>

          {/* Referral Summary */}
          <View style={[styles.detailPanel, { backgroundColor: colors.background }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={[styles.patientName, { color: colors.text }]}>{payload.patient}</Text>
                <Text style={[styles.patientId, { color: colors.textSecondary }]}>
                  {payload.patientId} · {payload.id}
                </Text>
              </View>
              <StatusPill status="Pending" />
            </View>
            <Detail label="Clinical reason" value={payload.reason} />
            <Detail label="Hospital route" value={`${payload.from} → ${payload.to}`} />
            <Detail label="Priority" value={payload.priority} />
          </View>

          {/* QR Code Graphic Box */}
          <View style={styles.qrContainer}>
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={JSON.stringify(payload)}
                size={185}
                color="#0E1E1A"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text style={[styles.qrInstruction, { color: colors.textSecondary }]}>
              Scan this QR code from the receiving facility or transport vehicle to view and decide the referral.
            </Text>
          </View>

          {/* Transfer Security PIN Box */}
          {payload.transferPin ? (
            <View style={[styles.pinBadgeContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <View style={styles.pinBadgeHeader}>
                <AppIcon ios="key.fill" android="vpn_key" color={colors.primary} size={15} />
                <Text style={[styles.pinBadgeTitle, { color: colors.textSecondary }]}>
                  Emergency Handover Security PIN / OTP
                </Text>
              </View>
              <Text style={[styles.pinBadgeValue, { color: colors.primary }]}>{payload.transferPin}</Text>
              <Text style={[styles.pinBadgeSub, { color: colors.textSecondary }]}>
                Offline Handover Protocol ($0 Cost): Share this 6-digit PIN with the receiving clinician to authorize acceptance without SMS/telecom fees.
              </Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={() => onSimulateScan(payload)}
              style={({ pressed }) => [
                styles.submitButton,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}>
              <AppIcon ios="qrcode.viewfinder" android="qr_code_scanner" color={colors.white} size={18} />
              <Text style={styles.acceptText}>Simulate Scan as Receiver</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.secondaryButtonLarge,
                { borderColor: colors.border, backgroundColor: colors.backgroundElement },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.secondaryButtonLargeText, { color: colors.text }]}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── QR Code Scanner modal ───────────────────────────────────────────────────

function ScanQrModal({
  visible,
  onClose,
  onScanned,
  lastGenerated,
}: {
  visible: boolean;
  onClose: () => void;
  onScanned: (payload: ReferralQRPayload) => void;
  lastGenerated: ReferralQRPayload | null;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setScanned(false);
      setError(null);
    }
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    try {
      const parsed = JSON.parse(data);
      if (parsed && parsed.patient && parsed.reason) {
        onScanned(parsed);
      } else {
        setError('QR code does not contain valid referral data.');
        setScanned(false);
      }
    } catch {
      setError('Scanned code is not valid JSON referral data.');
      setScanned(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      setError('Enter or paste QR code data.');
      return;
    }
    try {
      const parsed = JSON.parse(manualInput.trim());
      if (parsed && parsed.patient && parsed.reason) {
        onScanned(parsed);
      } else {
        setError('Missing required patient or referral fields.');
      }
    } catch {
      setError('Invalid JSON format. Please paste valid referral QR data.');
    }
  };

  const handleDemoScan = () => {
    const unique = `${Date.now().toString().slice(-4)}`;
    const demoPayload: ReferralQRPayload = {
      type: 'hospital_referral',
      version: '1.0',
      id: `RF-${unique}`,
      patient: 'Kofi Mensah',
      patientId: `PT-${unique}`,
      reason: 'Acute respiratory distress requiring intensive care unit transfer',
      priority: 'Emergency',
      from: 'Tema General Hospital',
      to: 'Korle Bu Teaching Hospital',
      contact: '+233 24 111 2233',
      transferPin: '739201',
      createdAt: new Date().toISOString(),
    };
    onScanned(demoPayload);
  };

  if (!visible) return null;

  const isCameraReady = Platform.OS !== 'web' && Boolean(permission?.granted);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalEyebrow, { color: colors.textSecondary }]}>SCANNER</Text>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Scan Referral QR</Text>
              </View>
              <Pressable
                accessibilityLabel="Close"
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: colors.backgroundElement }]}>
                <AppIcon ios="xmark" android="close" color={colors.text} size={17} />
              </Pressable>
            </View>

            {error ? (
              <View style={[styles.otpError, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
                <AppIcon ios="exclamationmark.circle.fill" android="error" color={colors.danger} size={16} />
                <Text style={[styles.otpErrorText, { color: colors.danger }]}>{error}</Text>
              </View>
            ) : null}

            {/* Camera View if native & permitted */}
            {isCameraReady ? (
              <View style={styles.cameraBox}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />
                <View style={styles.scannerReticle}>
                  <View style={[styles.reticleCorner, styles.reticleTopLeft]} />
                  <View style={[styles.reticleCorner, styles.reticleTopRight]} />
                  <View style={[styles.reticleCorner, styles.reticleBottomLeft]} />
                  <View style={[styles.reticleCorner, styles.reticleBottomRight]} />
                </View>
              </View>
            ) : (
              <View style={[styles.cameraPlaceholder, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <AppIcon ios="camera.fill" android="photo_camera" color={colors.primary} size={36} />
                <Text style={[styles.cameraPlaceholderTitle, { color: colors.text }]}>
                  {Platform.OS === 'web' ? 'Camera or Quick Test' : 'Camera Access Needed'}
                </Text>
                <Text style={[styles.cameraPlaceholderSub, { color: colors.textSecondary }]}>
                  {Platform.OS === 'web'
                    ? 'Use the instant simulation buttons below to test receiving and deciding referrals.'
                    : 'Grant camera access to scan physical referral QR codes.'}
                </Text>
                {Platform.OS !== 'web' && !permission?.granted ? (
                  <Pressable
                    onPress={requestPermission}
                    style={({ pressed }) => [
                      styles.permissionButton,
                      { backgroundColor: colors.primary },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
                  </Pressable>
                ) : null}
              </View>
            )}

            {/* Quick Test options */}
            <View style={{ gap: 8 }}>
              {lastGenerated ? (
                <Pressable
                  onPress={() => onScanned(lastGenerated)}
                  style={({ pressed }) => [
                    styles.simulatedOptionButton,
                    { backgroundColor: colors.primarySoft, borderColor: colors.primary },
                    pressed && styles.pressed,
                  ]}>
                  <AppIcon ios="arrow.down.doc.fill" android="file_download" color={colors.primary} size={16} />
                  <Text style={[styles.simulatedOptionText, { color: colors.primary }]}>
                    Scan Last Generated: {lastGenerated.patient} ({lastGenerated.id})
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={handleDemoScan}
                style={({ pressed }) => [
                  styles.simulatedOptionButton,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}>
                <AppIcon ios="play.circle.fill" android="play_circle" color={colors.text} size={16} />
                <Text style={[styles.simulatedOptionText, { color: colors.text }]}>
                  Simulate Incoming Transfer (Kofi Mensah · Emergency)
                </Text>
              </Pressable>
            </View>

            {/* Manual input fallback */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Or paste QR referral JSON</Text>
              <TextInput
                value={manualInput}
                onChangeText={setManualInput}
                placeholder='{"patient": "...", "reason": "...", ...}'
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.formInput,
                  { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, height: 42 },
                ]}
              />
              <Pressable
                onPress={handleManualSubmit}
                style={({ pressed }) => [
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                  pressed && styles.pressed,
                ]}>
                <AppIcon ios="doc.text.magnifyingglass" android="search" color={colors.white} size={16} />
                <Text style={styles.acceptText}>Process Referral Code</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Scanned referral review & decision modal ─────────────────────────────────

function ReviewScannedReferralModal({
  visible,
  referral,
  onClose,
  onAccept,
  onReject,
}: {
  visible: boolean;
  referral: ReferralQRPayload | null;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  if (!referral) return null;

  const priorityColor =
    referral.priority === 'Emergency'
      ? colors.danger
      : referral.priority === 'Urgent'
        ? colors.accent
        : colors.info;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalEyebrow, { color: colors.textSecondary }]}>INCOMING REFERRAL VIA QR</Text>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Referral Received</Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.backgroundElement }]}>
              <AppIcon ios="xmark" android="close" color={colors.text} size={17} />
            </Pressable>
          </View>

          {/* Banner */}
          <View style={[styles.otpInfo, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
            <AppIcon ios="qrcode" android="qr_code" color={colors.primary} size={18} />
            <Text style={[styles.otpInfoText, { color: colors.primary }]}>
              QR scan verified. Review the transfer details and choose whether to accept or reject this patient referral.
            </Text>
          </View>

          {/* Referral details */}
          <View style={[styles.detailPanel, { backgroundColor: colors.background }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={[styles.patientName, { color: colors.text }]}>{referral.patient}</Text>
                <Text style={[styles.patientId, { color: colors.textSecondary }]}>
                  {referral.patientId} · {referral.id}
                </Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
                <Text style={styles.priorityBadgeText}>{referral.priority}</Text>
              </View>
            </View>
            <Detail label="Clinical reason" value={referral.reason} />
            <Detail label="Sending facility" value={referral.from} />
            <Detail label="Receiving facility" value={referral.to} />
            <Detail label="Contact" value={referral.contact} />
            {referral.transferPin ? (
              <Detail label="Transfer Security PIN" value={`${referral.transferPin} (Verified)`} />
            ) : null}
          </View>

          {/* Decision Buttons: Accept or Reject */}
          <View style={styles.decisionRow}>
            <Pressable
              onPress={onReject}
              style={({ pressed }) => [
                styles.decisionButton,
                { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
                pressed && styles.pressed,
              ]}>
              <AppIcon ios="xmark" android="close" color={colors.danger} size={17} />
              <Text style={[styles.decisionText, { color: colors.danger }]}>Reject Referral</Text>
            </Pressable>
            <Pressable
              onPress={onAccept}
              style={({ pressed }) => [
                styles.decisionButton,
                { backgroundColor: colors.primary, borderColor: colors.primary },
                pressed && styles.pressed,
              ]}>
              <AppIcon ios="checkmark.shield.fill" android="verified_user" color={colors.white} size={17} />
              <Text style={styles.acceptText}>Accept Referral</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Restricted Access Screen for Unauthorized Roles ──────────────────────────

function RestrictedReferralAccessScreen({
  currentRole,
  userFacility,
  onSwitchRole,
}: {
  currentRole: AppRole;
  userFacility: string;
  onSwitchRole: (role: AppRole) => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const roleMeta = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.patient;

  return (
    <Screen
      title="Referrals"
      subtitle="Role-Based Access Control (RBAC)">
      <View style={[styles.restrictedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.restrictedIconBox, { backgroundColor: colors.dangerSoft }]}>
          <AppIcon ios="lock.shield.fill" android="lock" color={colors.danger} size={36} />
        </View>

        <Text style={[styles.restrictedTitle, { color: colors.text }]}>
          Role Access Restricted
        </Text>
        <Text style={[styles.restrictedDesc, { color: colors.textSecondary }]}>
          Inter-hospital transfers and referral operations are strictly limited to{' '}
          <Text style={{ fontWeight: '700', color: colors.text }}>Hospital Administrators</Text> and{' '}
          <Text style={{ fontWeight: '700', color: colors.text }}>Specialists</Text>.{' '}
          <Text style={{ fontWeight: '700', color: colors.text }}>System Administrators</Text> supervise network-wide transfers.
        </Text>

        <View style={[styles.currentRoleBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.currentRoleLabel, { color: colors.textSecondary }]}>CURRENT SIGNED-IN ROLE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <View style={[styles.roleBadgeSmall, { backgroundColor: roleMeta.badgeColor.bg, borderColor: roleMeta.badgeColor.border }]}>
              <Text style={[styles.roleBadgeSmallText, { color: roleMeta.badgeColor.text }]}>{roleMeta.title}</Text>
            </View>
          </View>
          <Text style={[styles.currentRoleFacility, { color: colors.textSecondary }]}>Facility: {userFacility}</Text>
        </View>

        <View style={styles.authorizedRolesBlock}>
          <Text style={[styles.authorizedBlockTitle, { color: colors.text }]}>Authorized Roles & Privileges:</Text>
          <View style={styles.privilegeItem}>
            <AppIcon ios="checkmark.shield.fill" android="verified_user" color={colors.primary} size={15} />
            <Text style={[styles.privilegeText, { color: colors.text }]}>
              <Text style={{ fontWeight: '700' }}>Specialists:</Text> Clinical triage, generate QR referrals, scan and accept or reject transfers.
            </Text>
          </View>
          <View style={styles.privilegeItem}>
            <AppIcon ios="checkmark.shield.fill" android="verified_user" color={colors.info} size={15} />
            <Text style={[styles.privilegeText, { color: colors.text }]}>
              <Text style={{ fontWeight: '700' }}>Hospital Admins:</Text> Manage hospital queue, bed coordination, and process referrals.
            </Text>
          </View>
          <View style={styles.privilegeItem}>
            <AppIcon ios="checkmark.shield.fill" android="verified_user" color={colors.danger} size={15} />
            <Text style={[styles.privilegeText, { color: colors.text }]}>
              <Text style={{ fontWeight: '700' }}>System Admins:</Text> Nationwide health exchange oversight across all connected facilities.
            </Text>
          </View>
        </View>

        <View style={styles.switchTestingSection}>
          <Text style={[styles.switchTestingLabel, { color: colors.textSecondary }]}>
            SWITCH TO AN AUTHORIZED ROLE TO TEST REFERRALS:
          </Text>
          <View style={{ gap: 8, width: '100%' }}>
            <Pressable
              onPress={() => onSwitchRole('specialist')}
              style={({ pressed }) => [
                styles.roleSwitchButton,
                { backgroundColor: colors.primarySoft, borderColor: colors.primary },
                pressed && styles.pressed,
              ]}>
              <AppIcon ios="heart.text.square.fill" android="local_hospital" color={colors.primary} size={16} />
              <Text style={[styles.roleSwitchButtonText, { color: colors.primary }]}>
                Switch to Specialist (Dr. Naa Lartey)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onSwitchRole('hospital_admin')}
              style={({ pressed }) => [
                styles.roleSwitchButton,
                { backgroundColor: colors.infoSoft, borderColor: colors.info },
                pressed && styles.pressed,
              ]}>
              <AppIcon ios="building.2.fill" android="domain" color={colors.info} size={16} />
              <Text style={[styles.roleSwitchButtonText, { color: colors.info }]}>
                Switch to Hospital Admin (Admin Mensah)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onSwitchRole('system_admin')}
              style={({ pressed }) => [
                styles.roleSwitchButton,
                { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
                pressed && styles.pressed,
              ]}>
              <AppIcon ios="shield.lefthalf.filled" android="admin_panel_settings" color={colors.danger} size={16} />
              <Text style={[styles.roleSwitchButtonText, { color: colors.danger }]}>
                Switch to System Admin (Emmanuel Asare - Network Oversight)
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
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
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  secondaryHeaderButton: {
    height: 40,
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryHeaderButtonText: { fontSize: 12, fontWeight: '700' },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  qrCodeWrapper: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrInstruction: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  secondaryButtonLarge: {
    height: 42,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonLargeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cameraBox: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  scannerReticle: {
    position: 'absolute',
    top: 30,
    left: '50%',
    marginLeft: -80,
    width: 160,
    height: 160,
  },
  reticleCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#58C4A8',
  },
  reticleTopLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  reticleTopRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  reticleBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  reticleBottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  cameraPlaceholder: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cameraPlaceholderTitle: { fontSize: 14, fontWeight: '800' },
  cameraPlaceholderSub: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
  permissionButton: {
    marginTop: 6,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  simulatedOptionButton: {
    minHeight: 40,
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simulatedOptionText: { fontSize: 11, fontWeight: '700', flex: 1 },
  priorityBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  // Oversight and Role Scope Styles
  oversightBanner: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginBottom: Spacing.three,
  },
  oversightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  oversightIconBox: {
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oversightTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  oversightPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  oversightPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  oversightSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  facilityFilterScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  facilityChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 1,
  },
  facilityChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  roleScopeBanner: {
    borderRadius: 7,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.three,
  },
  roleScopeTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  roleScopeSub: {
    fontSize: 10,
    lineHeight: 14,
  },
  // Restricted access styles
  restrictedCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  restrictedIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictedTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  restrictedDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 420,
  },
  currentRoleBox: {
    width: '100%',
    borderRadius: 7,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  currentRoleLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roleBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  roleBadgeSmallText: {
    fontSize: 11,
    fontWeight: '800',
  },
  currentRoleFacility: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  authorizedRolesBlock: {
    width: '100%',
    gap: 8,
    paddingVertical: 4,
  },
  authorizedBlockTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  privilegeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  privilegeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  switchTestingSection: {
    width: '100%',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  switchTestingLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roleSwitchButton: {
    minHeight: 40,
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleSwitchButtonText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  pinBadgeContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  pinBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinBadgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pinBadgeValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 4,
    marginVertical: 2,
  },
  pinBadgeSub: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
  otpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  autofillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  autofillButtonText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pressed: { opacity: 0.65 },
});
