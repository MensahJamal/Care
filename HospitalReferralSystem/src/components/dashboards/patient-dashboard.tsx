import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { StatusPill } from '@/components/ui/status-pill';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { RoleSwitcherBanner } from './role-switcher-banner';

export function PatientDashboard() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'referral' | 'records' | 'prescriptions'>('referral');

  const patientName = profile?.displayName || 'Ama Serwaa Owusu';

  return (
    <View style={styles.container}>
      <RoleSwitcherBanner />

      {/* Patient Health ID Card */}
      <View
        style={[
          styles.patientCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.patientTop}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primarySoft },
            ]}>
            <AppIcon ios="person.fill" android="person" color={colors.primary} size={28} />
          </View>
          <View style={styles.patientMeta}>
            <View style={styles.patientNameRow}>
              <Text style={[styles.patientName, { color: colors.text }]}>{patientName}</Text>
              <View style={[styles.nhisBadge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.nhisText, { color: colors.primary }]}>NHIS Active</Text>
              </View>
            </View>
            <Text style={[styles.patientId, { color: colors.textSecondary }]}>
              ID: PT-10942 · Blood: O+ · Age: 34 F
            </Text>
            <Text style={[styles.facilityTag, { color: colors.primaryDark }]}>
              Assigned Facility: {profile?.facilityName || 'Korle Bu Teaching Hospital'}
            </Text>
          </View>
        </View>

        {/* Quick patient stats */}
        <View style={[styles.statRow, { borderTopColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ACTIVE TRANSFER</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>In Transit</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>EST. ARRIVAL</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>18 Mins</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>CARE TEAM</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>Dr. Lartey</Text>
          </View>
        </View>
      </View>

      {/* Navigation tabs */}
      <View style={[styles.tabsBar, { backgroundColor: colors.backgroundElement }]}>
        <Pressable
          onPress={() => setActiveTab('referral')}
          style={[
            styles.tabItem,
            activeTab === 'referral' && { backgroundColor: colors.surface },
          ]}>
          <AppIcon
            ios="arrow.triangle.swap"
            android="swap_horiz"
            color={activeTab === 'referral' ? colors.primary : colors.textSecondary}
            size={16}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'referral' ? colors.text : colors.textSecondary },
              activeTab === 'referral' && styles.tabTextActive,
            ]}>
            Transfer Journey
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('records')}
          style={[
            styles.tabItem,
            activeTab === 'records' && { backgroundColor: colors.surface },
          ]}>
          <AppIcon
            ios="doc.text.fill"
            android="description"
            color={activeTab === 'records' ? colors.primary : colors.textSecondary}
            size={16}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'records' ? colors.text : colors.textSecondary },
              activeTab === 'records' && styles.tabTextActive,
            ]}>
            Lab Reports (2)
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('prescriptions')}
          style={[
            styles.tabItem,
            activeTab === 'prescriptions' && { backgroundColor: colors.surface },
          ]}>
          <AppIcon
            ios="pills.fill"
            android="medication"
            color={activeTab === 'prescriptions' ? colors.primary : colors.textSecondary}
            size={16}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'prescriptions' ? colors.text : colors.textSecondary },
              activeTab === 'prescriptions' && styles.tabTextActive,
            ]}>
            Prescriptions
          </Text>
        </Pressable>
      </View>

      {/* Tab 1: Live Referral Timeline */}
      {activeTab === 'referral' && (
        <View style={styles.section}>
          <View
            style={[
              styles.timelineCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.timelineHeader}>
              <View>
                <Text style={[styles.timelineTitle, { color: colors.text }]}>
                  Referral #RF-2048: Acute Respiratory Distress
                </Text>
                <Text style={[styles.timelineSub, { color: colors.textSecondary }]}>
                  Origin: Ridge Hospital · Destination: Korle Bu Emergency
                </Text>
              </View>
              <StatusPill status="In transit" />
            </View>

            {/* Stages */}
            <View style={styles.stagesContainer}>
              <TimelineStep
                title="1. Referral Requested by Dr. Addo"
                time="Today at 08:15 AM"
                desc="Clinical summary and oxygen requirement transmitted via CareLink."
                completed
                colors={colors}
              />
              <TimelineStep
                title="2. Accepted by Receiving Specialist"
                time="Today at 08:24 AM"
                desc="Dr. Naa Lartey accepted case. Bed reserved in Ward 3B."
                completed
                colors={colors}
              />
              <TimelineStep
                title="3. Ambulance En Route (Live GPS)"
                time="Today at 08:38 AM"
                desc="National Ambulance Unit AMB-04 dispatched. ETA: 18 minutes."
                active
                colors={colors}
              />
              <TimelineStep
                title="4. Arrival & Specialist Handover"
                time="Pending Arrival"
                desc="Triage bay prepared. Continuous pulse oximetry monitoring ready."
                completed={false}
                colors={colors}
              />
            </View>

            {/* Ambulance Dispatch details */}
            <View
              style={[
                styles.dispatchBox,
                { backgroundColor: colors.accentSoft, borderColor: colors.accent },
              ]}>
              <AppIcon ios="location.fill" android="navigation" color={colors.accent} size={20} />
              <View style={styles.dispatchTextWrapper}>
                <Text style={[styles.dispatchTitle, { color: colors.accent }]}>
                  Ambulance AMB-04 · Driver K. Boateng
                </Text>
                <Text style={[styles.dispatchSubtitle, { color: colors.textSecondary }]}>
                  Emergency transport underway. Paramedic on board: Sarah Annan (+233 24 000 1122)
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Tab 2: Lab Reports */}
      {activeTab === 'records' && (
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Attached Clinical Diagnostics</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Uploaded by Ridge Lab and shared with receiving medical staff
            </Text>

            <View style={styles.recordList}>
              <View style={[styles.recordRow, { borderColor: colors.border }]}>
                <View style={[styles.recordIcon, { backgroundColor: colors.infoSoft }]}>
                  <AppIcon ios="waveform.path.ecg" android="monitor_heart" color={colors.info} size={20} />
                </View>
                <View style={styles.recordBody}>
                  <Text style={[styles.recordTitle, { color: colors.text }]}>12-Lead Electrocardiogram (ECG)</Text>
                  <Text style={[styles.recordMeta, { color: colors.textSecondary }]}>
                    Sinus tachycardia, rate 118 bpm · Verified by Dr. Addo
                  </Text>
                </View>
                <View style={[styles.verifiedTag, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.verifiedText, { color: colors.primary }]}>Attached</Text>
                </View>
              </View>

              <View style={[styles.recordRow, { borderColor: colors.border }]}>
                <View style={[styles.recordIcon, { backgroundColor: colors.primarySoft }]}>
                  <AppIcon ios="drop.fill" android="science" color={colors.primary} size={20} />
                </View>
                <View style={styles.recordBody}>
                  <Text style={[styles.recordTitle, { color: colors.text }]}>Arterial Blood Gas (ABG)</Text>
                  <Text style={[styles.recordMeta, { color: colors.textSecondary }]}>
                    pH 7.31, pO2 68 mmHg, pCO2 48 mmHg · Urgent
                  </Text>
                </View>
                <View style={[styles.verifiedTag, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.verifiedText, { color: colors.primary }]}>Attached</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Tab 3: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>In-Transit & Inpatient Medication</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Verified by Clinical Pharmacist Pharm. David Osei
            </Text>

            <View style={styles.recordList}>
              <View style={[styles.recordRow, { borderColor: colors.border }]}>
                <View style={[styles.recordIcon, { backgroundColor: colors.accentSoft }]}>
                  <AppIcon ios="pills" android="medication" color={colors.accent} size={20} />
                </View>
                <View style={styles.recordBody}>
                  <Text style={[styles.recordTitle, { color: colors.text }]}>Salbutamol Nebulization 5mg</Text>
                  <Text style={[styles.recordMeta, { color: colors.textSecondary }]}>
                    Stat dose administered in transit with continuous oxygen
                  </Text>
                </View>
                <StatusPill status="Accepted" />
              </View>

              <View style={[styles.recordRow, { borderColor: colors.border }]}>
                <View style={[styles.recordIcon, { backgroundColor: colors.primarySoft }]}>
                  <AppIcon ios="syringe" android="vaccines" color={colors.primary} size={20} />
                </View>
                <View style={styles.recordBody}>
                  <Text style={[styles.recordTitle, { color: colors.text }]}>Hydrocortisone IV 100mg</Text>
                  <Text style={[styles.recordMeta, { color: colors.textSecondary }]}>
                    Single dose prior to hospital departure
                  </Text>
                </View>
                <StatusPill status="Accepted" />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Emergency Contact Bar */}
      <View style={[styles.supportBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.supportTextWrapper}>
          <Text style={[styles.supportTitle, { color: colors.text }]}>Need Help With Your Referral?</Text>
          <Text style={[styles.supportSub, { color: colors.textSecondary }]}>
            24/7 National Patient Referral Hotline: +233 30 266 2540
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.callButton,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}>
          <AppIcon ios="phone.fill" android="call" color="#FFFFFF" size={15} />
          <Text style={styles.callButtonText}>Call Support</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TimelineStep({
  title,
  time,
  desc,
  completed,
  active,
  colors,
}: {
  title: string;
  time: string;
  desc: string;
  completed?: boolean;
  active?: boolean;
  colors: (typeof Colors)[keyof typeof Colors];
}) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIndicatorCol}>
        <View
          style={[
            styles.stepDot,
            completed && { backgroundColor: colors.primary, borderColor: colors.primary },
            active && { backgroundColor: colors.accent, borderColor: colors.accent },
            !completed && !active && { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          {completed && (
            <AppIcon ios="checkmark" android="check" color="#FFFFFF" size={12} />
          )}
          {active && (
            <View style={styles.pulseInner} />
          )}
        </View>
        <View style={[styles.stepLine, { backgroundColor: completed ? colors.primary : colors.border }]} />
      </View>
      <View style={styles.stepContent}>
        <View style={styles.stepTitleRow}>
          <Text style={[styles.stepTitle, { color: colors.text }, active && { color: colors.accent, fontWeight: '800' }]}>
            {title}
          </Text>
          <Text style={[styles.stepTime, { color: colors.textSecondary }]}>{time}</Text>
        </View>
        <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
  },
  patientCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  patientTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientMeta: {
    flex: 1,
    gap: 3,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '800',
  },
  nhisBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  nhisText: {
    fontSize: 10,
    fontWeight: '700',
  },
  patientId: {
    fontSize: 11,
  },
  facilityTag: {
    fontSize: 11,
    fontWeight: '600',
  },
  statRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 28,
  },
  tabsBar: {
    borderRadius: 8,
    padding: 3,
    flexDirection: 'row',
    gap: 4,
  },
  tabItem: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '800',
  },
  section: {
    gap: Spacing.three,
  },
  timelineCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  timelineSub: {
    fontSize: 11,
    marginTop: 2,
  },
  stagesContainer: {
    gap: 4,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 58,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 22,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    width: 2,
    marginVertical: 2,
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepTime: {
    fontSize: 10,
  },
  stepDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  dispatchBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dispatchTextWrapper: {
    flex: 1,
    gap: 2,
  },
  dispatchTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  dispatchSubtitle: {
    fontSize: 11,
  },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
  },
  recordList: {
    gap: 10,
  },
  recordRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBody: {
    flex: 1,
    gap: 2,
  },
  recordTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  recordMeta: {
    fontSize: 11,
  },
  verifiedTag: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  supportBar: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  supportTextWrapper: {
    flex: 1,
    gap: 2,
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  supportSub: {
    fontSize: 11,
  },
  callButton: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
