import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, useColorScheme, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { Screen } from '@/components/ui/screen';
import { Colors, Spacing } from '@/constants/theme';
import { HospitalResource, useReferrals } from '@/context/referral-context';



export default function ResourcesScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { resources, updateBeds, specialists, updateSpecialistStatus } = useReferrals();
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const ownFacility = resources[0] ?? {
    id: 'kbth',
    name: 'Korle Bu Teaching Hospital',
    distance: 'Your facility',
    beds: 0,
    totalBeds: 0,
    specialists: 0,
    specialties: [],
    lastUpdated: 'Live',
  };
  const visible = showAvailableOnly
    ? resources.filter((resource: HospitalResource) => resource.beds >= 10)
    : resources;

  return (
    <Screen title="Capacity" subtitle="Live beds and specialist availability across the network">
      <View style={[styles.updatePanel, { backgroundColor: colors.primaryDark }]}>
        <View style={styles.updateHeading}>
          <View style={styles.updateIcon}>
            <AppIcon ios="building.2.fill" android="medical_services" color={colors.white} size={21} />
          </View>
          <View style={styles.updateCopy}>
            <Text style={styles.updateTitle}>Your facility capacity</Text>
            <Text style={styles.updateSubtitle}>Keep availability current for safer referrals.</Text>
          </View>
          <Text style={styles.updatedNow}>{ownFacility.lastUpdated}</Text>
        </View>
        <View style={styles.capacityEditor}>
          <View>
            <Text style={styles.editorLabel}>AVAILABLE BEDS</Text>
            <Text style={styles.editorValue}>{ownFacility.beds}</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable
              accessibilityLabel="Decrease available beds"
              onPress={() => updateBeds(ownFacility.id, ownFacility.beds - 1)}
              style={({ pressed }: { pressed: boolean }) => [styles.stepperButton, pressed && styles.pressed]}>
              <Text style={styles.stepperSymbol}>−</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Increase available beds"
              onPress={() => updateBeds(ownFacility.id, ownFacility.beds + 1)}
              style={({ pressed }: { pressed: boolean }) => [styles.stepperButton, pressed && styles.pressed]}>
              <Text style={styles.stepperSymbol}>+</Text>
            </Pressable>
          </View>
          <View style={styles.editorDivider} />
          <View>
            <Text style={styles.editorLabel}>TOTAL CAPACITY</Text>
            <Text style={styles.editorValue}>{ownFacility.totalBeds}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Connected hospitals</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {visible.length} facilities reporting live availability
            </Text>
          </View>
          <View style={styles.filter}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>10+ beds only</Text>
            <Switch
              value={showAvailableOnly}
              onValueChange={setShowAvailableOnly}
              trackColor={{ false: colors.backgroundElement, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>
        <View style={styles.hospitalList}>
          {visible.map((hospital: HospitalResource) => (
            <HospitalRow key={hospital.id} hospital={hospital} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Specialist roster</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Staff at your facility visible to referral partners
          </Text>
        </View>
        <View
          style={[
            styles.specialistList,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          {specialists.length === 0 ? (
            <View style={styles.specialistEmpty}>
              <Text style={[styles.specialistEmptyText, { color: colors.textSecondary }]}>
                No specialists found for this facility.
              </Text>
            </View>
          ) : specialists.map((specialist, index) => (
            <View
              key={specialist.id}
              style={[
                styles.specialistRow,
                index < specialists.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}>
              <View style={[styles.avatar, { backgroundColor: colors.infoSoft }]}>
                <Text style={[styles.avatarText, { color: colors.info }]}>
                  {specialist.name
                    .split(' ')
                    .slice(1)
                    .map((part) => part[0])
                    .join('')}
                </Text>
              </View>
              <View style={styles.specialistMain}>
                <Text style={[styles.specialistName, { color: colors.text }]}>
                  {specialist.name}
                </Text>
                <Text style={[styles.specialistMeta, { color: colors.textSecondary }]}>
                  {specialist.specialty} · {specialist.isOnCall ? specialist.status : 'Unavailable'}
                </Text>
              </View>
              <Switch
                value={specialist.isOnCall}
                onValueChange={(value) => updateSpecialistStatus(specialist.id, value)}
                trackColor={{ false: colors.backgroundElement, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

function HospitalRow({ hospital }: { hospital: HospitalResource; key?: string }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const percent = Math.max(3, Math.round((hospital.beds / hospital.totalBeds) * 100));
  const tone = hospital.beds > 10 ? colors.primary : hospital.beds > 0 ? colors.accent : colors.danger;

  return (
    <View
      style={[styles.hospitalRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.hospitalMark, { backgroundColor: colors.primarySoft }]}>
        <AppIcon ios="cross.case.fill" android="medical_services" color={colors.primary} size={20} />
      </View>
      <View style={styles.hospitalMain}>
        <View style={styles.hospitalTitleRow}>
          <View>
            <Text style={[styles.hospitalName, { color: colors.text }]}>{hospital.name}</Text>
            <Text style={[styles.distance, { color: colors.textSecondary }]}>
              {hospital.distance} · {hospital.lastUpdated}
            </Text>
          </View>
          <View style={styles.bedCount}>
            <Text style={[styles.bedNumber, { color: tone }]}>{hospital.beds}</Text>
            <Text style={[styles.bedLabel, { color: colors.textSecondary }]}>beds</Text>
          </View>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.backgroundElement }]}>
          <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: tone }]} />
        </View>
        <View style={styles.specialties}>
          {hospital.specialties.map((specialty) => (
            <View
              key={specialty}
              style={[styles.specialtyTag, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.specialtyText, { color: colors.textSecondary }]}>{specialty}</Text>
            </View>
          ))}
          <Text style={[styles.specialistCount, { color: colors.textSecondary }]}>
            {hospital.specialists} specialists
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  updatePanel: { borderRadius: 8, padding: 18, gap: 16 },
  updateHeading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  updateIcon: {
    width: 39,
    height: 39,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateCopy: { flex: 1, gap: 2 },
  updateTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  updateSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  updatedNow: { color: 'rgba(255,255,255,0.7)', fontSize: 9 },
  capacityEditor: {
    minHeight: 74,
    borderRadius: 7,
    paddingHorizontal: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  editorLabel: { color: 'rgba(255,255,255,0.62)', fontSize: 8, fontWeight: '800' },
  editorValue: { color: '#FFFFFF', fontSize: 24, lineHeight: 29, fontWeight: '800' },
  stepper: { flexDirection: 'row', gap: 7, marginLeft: 8 },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSymbol: { color: '#FFFFFF', fontSize: 21, lineHeight: 23, fontWeight: '500' },
  editorDivider: { width: 1, height: 38, backgroundColor: 'rgba(255,255,255,0.18)', marginLeft: 'auto' },
  section: { gap: Spacing.three },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, lineHeight: 22, fontWeight: '800' },
  sectionSubtitle: { fontSize: 10, lineHeight: 15, marginTop: 2 },
  filter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  filterLabel: { fontSize: 10, fontWeight: '600' },
  hospitalList: { gap: Spacing.three },
  hospitalRow: {
    minHeight: 130,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    gap: 13,
  },
  hospitalMark: { width: 38, height: 38, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  hospitalMain: { flex: 1, gap: 11 },
  hospitalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  hospitalName: { fontSize: 13, fontWeight: '800' },
  distance: { fontSize: 9, marginTop: 3 },
  bedCount: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  bedNumber: { fontSize: 19, fontWeight: '800' },
  bedLabel: { fontSize: 9 },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  specialties: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  specialtyTag: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 4 },
  specialtyText: { fontSize: 8, fontWeight: '700' },
  specialistCount: { fontSize: 8, marginLeft: 'auto' },
  specialistList: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  specialistRow: { minHeight: 76, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '800' },
  specialistMain: { flex: 1, gap: 3 },
  specialistName: { fontSize: 12, fontWeight: '800' },
  specialistMeta: { fontSize: 9 },
  specialistEmpty: { minHeight: 60, alignItems: 'center', justifyContent: 'center', padding: 16 },
  specialistEmptyText: { fontSize: 11 },
  pressed: { opacity: 0.65 },
});
