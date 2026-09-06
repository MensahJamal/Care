import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { AppIcon } from '@/components/ui/app-icon';
import { StatusPill } from '@/components/ui/status-pill';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { Referral, useReferrals } from '@/context/referral-context';
import { RoleSwitcherBanner } from './role-switcher-banner';

export function PcpDashboard() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const compact = width < 600;
  const { profile } = useAuth();
  const { referrals, resources, addReferral } = useReferrals();

  const [showQuickReferral, setShowQuickReferral] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'Emergency' | 'Urgent' | 'Routine'>('Urgent');
  const [targetHospital, setTargetHospital] = useState('Korle Bu Teaching Hospital');
  const [submitting, setSubmitting] = useState(false);

  const outgoing = referrals.filter((r: Referral) => r.direction === 'sent');
  const pendingCount = outgoing.filter((r: Referral) => r.status === 'Pending').length;

  async function handleCreateReferral() {
    if (!patientName.trim() || !reason.trim()) return;
    setSubmitting(true);
    try {
      await addReferral({
        patient: patientName.trim(),
        reason: reason.trim(),
        priority,
        to: targetHospital,
        contact: profile?.phone || '+233 24 555 0199',
      });
      setPatientName('');
      setReason('');
      setShowQuickReferral(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <RoleSwitcherBanner />

      {/* PCP Command Hero */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.heroTop}>
          <View style={styles.heroMeta}>
            <View style={styles.badgeRow}>
              <View style={[styles.pcpBadge, { backgroundColor: colors.primarySoft }]}>
                <AppIcon ios="stethoscope" android="medical_services" color={colors.primary} size={14} />
                <Text style={[styles.pcpBadgeText, { color: colors.primary }]}>
                  Primary Care Dispatch Hub
                </Text>
              </View>
              <Text style={[styles.facilityText, { color: colors.textSecondary }]}>
                {profile?.facilityName || 'Ridge PolyClinic'}
              </Text>
            </View>
            <Text style={[styles.doctorTitle, { color: colors.text }]}>
              {profile?.displayName || 'Dr. Kwame Addo'}
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Fast-track urgent outpatient escalations to specialized secondary centers.
            </Text>
          </View>

          <Pressable
            onPress={() => setShowQuickReferral((prev) => !prev)}
            style={({ pressed }) => [
              styles.dispatchBtn,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}>
            <AppIcon ios="plus.circle.fill" android="add_circle" color="#FFFFFF" size={17} />
            <Text style={styles.dispatchBtnText}>Initiate Referral</Text>
          </Pressable>
        </View>

        {/* Quick metrics */}
        <View style={[styles.metricsRow, { borderTopColor: colors.border }]}>
          <View style={styles.metricCol}>
            <Text style={[styles.metricNumber, { color: colors.text }]}>{outgoing.length}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Dispatched Transfers</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.metricCol}>
            <Text style={[styles.metricNumber, { color: colors.accent }]}>{pendingCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Awaiting Hospital Bed</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.metricCol}>
            <Text style={[styles.metricNumber, { color: colors.primary }]}>
              {outgoing.filter((r) => r.status === 'Accepted' || r.status === 'In transit').length}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Active / En Route</Text>
          </View>
        </View>
      </View>

      {/* Quick Referral Dispatch Form */}
      {showQuickReferral && (
        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.surface, borderColor: colors.primary },
          ]}>
          <View style={styles.formHeader}>
            <View>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                New Inter-Hospital Transfer Requisition
              </Text>
              <Text style={[styles.formSub, { color: colors.textSecondary }]}>
                Transmits immediately to receiving specialist and intake triage
              </Text>
            </View>
            <Pressable onPress={() => setShowQuickReferral(false)}>
              <AppIcon ios="xmark" android="close" color={colors.textSecondary} size={18} />
            </Pressable>
          </View>

          <View style={styles.fieldsGap}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Patient Full Name</Text>
                <TextInput
                  value={patientName}
                  onChangeText={setPatientName}
                  placeholder="e.g. Kofi Mensah"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                />
              </View>

              <View style={styles.fieldCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Receiving Center</Text>
                <TextInput
                  value={targetHospital}
                  onChangeText={setTargetHospital}
                  placeholder="e.g. Korle Bu Teaching Hospital"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                />
              </View>
            </View>

            <View style={styles.fieldCol}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Clinical Reason & Indications</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. Acute coronary syndrome requiring catheterization"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />
            </View>

            <View style={styles.fieldCol}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Triage Priority</Text>
              <View style={styles.priorityRow}>
                {(['Emergency', 'Urgent', 'Routine'] as const).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.priorityBtn,
                      priority === p && {
                        backgroundColor: p === 'Emergency' ? colors.dangerSoft : colors.primarySoft,
                        borderColor: p === 'Emergency' ? colors.danger : colors.primary,
                      },
                      priority !== p && { borderColor: colors.border, backgroundColor: colors.background },
                    ]}>
                    <Text
                      style={[
                        styles.priorityText,
                        priority === p && {
                          color: p === 'Emergency' ? colors.danger : colors.primary,
                          fontWeight: '800',
                        },
                        priority !== p && { color: colors.textSecondary },
                      ]}>
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              disabled={submitting}
              onPress={handleCreateReferral}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: colors.primary },
                (pressed || submitting) && styles.pressed,
              ]}>
              <AppIcon ios="paperplane.fill" android="send" color="#FFFFFF" size={15} />
              <Text style={styles.submitBtnText}>
                {submitting ? 'Transmitting...' : 'Dispatch Requisition to Network'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Dispatched Referrals Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Outgoing Referrals</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Live status tracking of referred patients
            </Text>
          </View>
          <Pressable onPress={() => router.push('/referrals')}>
            <Text style={[styles.linkAction, { color: colors.primary }]}>View All Queue</Text>
          </Pressable>
        </View>

        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {outgoing.slice(0, 4).map((ref, idx) => (
            <View
              key={ref.id}
              style={[
                styles.referralRow,
                idx < outgoing.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}>
              <View
                style={[
                  styles.priorityStrip,
                  { backgroundColor: ref.priority === 'Emergency' ? colors.danger : colors.accent },
                ]}
              />
              <View style={styles.referralMain}>
                <View style={styles.referralHeader}>
                  <Text style={[styles.patientName, { color: colors.text }]}>{ref.patient}</Text>
                  <StatusPill status={ref.status} />
                </View>
                <Text numberOfLines={1} style={[styles.reasonText, { color: colors.textSecondary }]}>
                  {ref.reason}
                </Text>
                <Text style={[styles.destText, { color: colors.textSecondary }]}>
                  To: {ref.to} · {ref.time}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Live Hospital Capacity for PCP Referrals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Regional Hospital Bed Capacity</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Verify bed availability before dispatching emergency ambulance
            </Text>
          </View>
          <Pressable onPress={() => router.push('/resources')}>
            <Text style={[styles.linkAction, { color: colors.primary }]}>Capacity Map</Text>
          </Pressable>
        </View>

        <View style={[styles.capacityGrid, compact && styles.capacityGridCompact]}>
          {resources.slice(0, 3).map((res) => (
            <View
              key={res.id}
              style={[
                styles.capacityCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <View style={styles.capacityCardTop}>
                <Text numberOfLines={1} style={[styles.hospitalName, { color: colors.text }]}>
                  {res.name}
                </Text>
                <View
                  style={[
                    styles.availBadge,
                    { backgroundColor: res.beds > 10 ? colors.primarySoft : colors.accentSoft },
                  ]}>
                  <Text
                    style={[
                      styles.availText,
                      { color: res.beds > 10 ? colors.primary : colors.accent },
                    ]}>
                    {res.beds > 10 ? 'Open Beds' : 'Critical'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.distText, { color: colors.textSecondary }]}>{res.distance}</Text>
              <View style={styles.capacityNumbers}>
                <Text style={[styles.bedsValue, { color: colors.text }]}>{res.beds}</Text>
                <Text style={[styles.bedsLabel, { color: colors.textSecondary }]}>
                  / {res.totalBeds} beds
                </Text>
                <Text style={[styles.specsValue, { color: colors.primary }]}>
                  · {res.specialists} On-Call Doctors
                </Text>
              </View>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  heroMeta: {
    flex: 1,
    gap: 4,
    minWidth: 260,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pcpBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pcpBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  facilityText: {
    fontSize: 11,
  },
  doctorTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  heroSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  dispatchBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dispatchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  metricsRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricCol: {
    alignItems: 'center',
    gap: 2,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 32,
  },
  formCard: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  formSub: {
    fontSize: 11,
    marginTop: 2,
  },
  fieldsGap: {
    gap: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  fieldCol: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  submitBtn: {
    height: 40,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
  },
  linkAction: {
    fontSize: 11,
    fontWeight: '800',
  },
  listCard: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  referralRow: {
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityStrip: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  referralMain: {
    flex: 1,
    gap: 3,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 13,
    fontWeight: '800',
  },
  reasonText: {
    fontSize: 11,
  },
  destText: {
    fontSize: 10,
  },
  capacityGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  capacityGridCompact: {
    flexDirection: 'column',
  },
  capacityCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  capacityCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hospitalName: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  availBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  availText: {
    fontSize: 9,
    fontWeight: '800',
  },
  distText: {
    fontSize: 10,
  },
  capacityNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  bedsValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  bedsLabel: {
    fontSize: 10,
  },
  specsValue: {
    fontSize: 10,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
