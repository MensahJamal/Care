import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { Screen } from '@/components/ui/screen';
import { StatusPill } from '@/components/ui/status-pill';
import { Colors, Spacing } from '@/constants/theme';
import { Referral, useReferrals } from '@/context/referral-context';

export default function DashboardScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const compact = width < 600;
  const { referrals, resources } = useReferrals();
  const incoming = referrals.filter(
    (referral) => referral.direction === 'incoming' && referral.status === 'Pending',
  );
  const ownFacility = resources[0];

  return (
    <Screen
      title="Good morning, Dr. Addo"
      subtitle="Thursday, 16 July · Korle Bu Teaching Hospital"
      action={
        <Pressable
          accessibilityLabel="Notifications"
          style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppIcon ios="bell" android="notifications" color={colors.text} size={20} />
          <View style={[styles.notificationDot, { borderColor: colors.surface }]} />
        </Pressable>
      }>
      <View style={[styles.alert, { backgroundColor: colors.primaryDark }]}>
        <View style={styles.alertIcon}>
          <AppIcon ios="bolt.heart.fill" android="medical_services" color={colors.white} size={22} />
        </View>
        <View style={styles.alertCopy}>
          <Text style={styles.alertTitle}>
            {incoming.length} referral{incoming.length === 1 ? '' : 's'} need a response
          </Text>
          <Text style={styles.alertText}>Review clinical details and confirm capacity promptly.</Text>
        </View>
        <Pressable
          onPress={() => router.push('/referrals')}
          style={({ pressed }) => [styles.alertAction, pressed && styles.pressed]}>
          <Text style={styles.alertActionText}>Review</Text>
          <AppIcon ios="chevron.right" android="arrow_forward" color={colors.white} size={15} />
        </Pressable>
      </View>

      <View style={[styles.metrics, compact && styles.metricsCompact]}>
        <Metric
          label="Available beds"
          value={`${ownFacility.beds}`}
          detail={`of ${ownFacility.totalBeds} total`}
          ios="bed.double.fill"
          android="bed"
          color={colors.primary}
          background={colors.primarySoft}
        />
        <Metric
          label="On-call specialists"
          value={`${ownFacility.specialists}`}
          detail="3 departments"
          ios="stethoscope"
          android="medical_services"
          color={colors.info}
          background={colors.infoSoft}
        />
        <Metric
          label="Active referrals"
          value={`${referrals.filter((referral) => referral.status !== 'Rejected').length}`}
          detail={`${incoming.length} awaiting you`}
          ios="arrow.left.arrow.right"
          android="swap_horiz"
          color={colors.accent}
          background={colors.accentSoft}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Incoming referrals</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Requests awaiting a decision
            </Text>
          </View>
          <Pressable onPress={() => router.push('/referrals')} hitSlop={10}>
            <Text style={[styles.textAction, { color: colors.primary }]}>View all</Text>
          </Pressable>
        </View>
        <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {incoming.map((referral, index) => (
            <ReferralRow
              key={referral.id}
              referral={referral}
              isLast={index === incoming.length - 1}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby capacity</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Live availability from connected facilities
            </Text>
          </View>
          <Pressable onPress={() => router.push('/resources')} hitSlop={10}>
            <Text style={[styles.textAction, { color: colors.primary }]}>Open map</Text>
          </Pressable>
        </View>
      <View style={[styles.capacityGrid, compact && styles.capacityGridCompact]}>
          {resources.slice(1, 4).map((resource) => (
            <Pressable
              key={resource.id}
              onPress={() => router.push('/resources')}
              style={({ pressed }) => [
                styles.capacityCard,
                compact && styles.capacityCardCompact,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.pressed,
              ]}>
              <View style={styles.capacityTop}>
                <View style={[styles.hospitalIcon, { backgroundColor: colors.backgroundElement }]}>
                  <AppIcon ios="cross.case.fill" android="medical_services" color={colors.primary} />
                </View>
                <View
                  style={[
                    styles.availability,
                    { backgroundColor: resource.beds > 10 ? colors.primarySoft : colors.accentSoft },
                  ]}>
                  <Text
                    style={[
                      styles.availabilityText,
                      { color: resource.beds > 10 ? colors.primary : colors.accent },
                    ]}>
                    {resource.beds > 10 ? 'Available' : 'Limited'}
                  </Text>
                </View>
              </View>
              <Text numberOfLines={2} style={[styles.hospitalName, { color: colors.text }]}>
                {resource.name}
              </Text>
              <Text style={[styles.distance, { color: colors.textSecondary }]}>
                {resource.distance}
              </Text>
              <View style={[styles.capacityFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.capacityNumber, { color: colors.text }]}>{resource.beds}</Text>
                <Text style={[styles.capacityLabel, { color: colors.textSecondary }]}>beds</Text>
                <View style={[styles.smallDivider, { backgroundColor: colors.border }]} />
                <Text style={[styles.capacityNumber, { color: colors.text }]}>
                  {resource.specialists}
                </Text>
                <Text style={[styles.capacityLabel, { color: colors.textSecondary }]}>specialists</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

function Metric({
  label,
  value,
  detail,
  ios,
  android,
  color,
  background,
}: {
  label: string;
  value: string;
  detail: string;
  ios: Parameters<typeof AppIcon>[0]['ios'];
  android: Parameters<typeof AppIcon>[0]['android'];
  color: string;
  background: string;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <View style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.metricIcon, { backgroundColor: background }]}>
        <AppIcon ios={ios} android={android} color={color} size={21} />
      </View>
      <View>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
        <View style={styles.metricValueRow}>
          <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.metricDetail, { color: colors.textSecondary }]}>{detail}</Text>
        </View>
      </View>
    </View>
  );
}

function ReferralRow({ referral, isLast }: { referral: Referral; isLast: boolean }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <Pressable
      onPress={() => router.push('/referrals')}
      style={({ pressed }) => [
        styles.referralRow,
        !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.priorityLine,
          { backgroundColor: referral.priority === 'Emergency' ? colors.danger : colors.accent },
        ]}
      />
      <View style={styles.referralMain}>
        <View style={styles.referralNameLine}>
          <Text style={[styles.patientName, { color: colors.text }]}>{referral.patient}</Text>
          <StatusPill status={referral.status} />
        </View>
        <Text numberOfLines={1} style={[styles.reason, { color: colors.textSecondary }]}>
          {referral.reason}
        </Text>
        <Text style={[styles.source, { color: colors.textSecondary }]}>
          {referral.from} · {referral.time}
        </Text>
      </View>
      <AppIcon ios="chevron.right" android="arrow_forward" color={colors.textSecondary} size={17} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D94B43',
    borderWidth: 1.5,
  },
  alert: {
    minHeight: 88,
    borderRadius: 8,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  alertIcon: {
    width: 42,
    height: 42,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCopy: { flex: 1, gap: 3 },
  alertTitle: { color: '#FFFFFF', fontSize: 15, lineHeight: 20, fontWeight: '800' },
  alertText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, lineHeight: 16 },
  alertAction: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  alertActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  metrics: { flexDirection: 'row', gap: Spacing.three },
  metricsCompact: { flexDirection: 'column' },
  metric: {
    flex: 1,
    minHeight: 92,
    borderRadius: 8,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: { fontSize: 10, lineHeight: 14, fontWeight: '600' },
  metricValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 1 },
  metricValue: { fontSize: 23, lineHeight: 28, fontWeight: '800' },
  metricDetail: { fontSize: 9, lineHeight: 13 },
  section: { gap: Spacing.three },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  sectionTitle: { fontSize: 17, lineHeight: 22, fontWeight: '800' },
  sectionSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  textAction: { fontSize: 11, fontWeight: '800' },
  list: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  referralRow: {
    minHeight: 92,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  priorityLine: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  referralMain: { flex: 1, gap: 3 },
  referralNameLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  patientName: { fontSize: 14, fontWeight: '800' },
  reason: { fontSize: 11, lineHeight: 16 },
  source: { fontSize: 10, lineHeight: 14 },
  capacityGrid: { flexDirection: 'row', gap: Spacing.three },
  capacityGridCompact: { flexDirection: 'column' },
  capacityCard: { flex: 1, minHeight: 178, borderRadius: 8, borderWidth: 1, padding: Spacing.three },
  capacityCardCompact: { minHeight: 155 },
  capacityTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  hospitalIcon: {
    width: 34,
    height: 34,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availability: { height: 22, borderRadius: 5, paddingHorizontal: 7, justifyContent: 'center' },
  availabilityText: { fontSize: 9, fontWeight: '800' },
  hospitalName: { minHeight: 34, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  distance: { fontSize: 9, marginTop: 2 },
  capacityFooter: {
    marginTop: 'auto',
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  capacityNumber: { fontSize: 14, fontWeight: '800' },
  capacityLabel: { fontSize: 8 },
  smallDivider: { width: 1, height: 13, marginHorizontal: 4 },
  pressed: { opacity: 0.65 },
});
