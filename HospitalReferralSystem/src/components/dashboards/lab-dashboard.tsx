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
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { RoleSwitcherBanner } from './role-switcher-banner';

interface LabOrder {
  id: string;
  patientName: string;
  patientId: string;
  testName: string;
  urgency: 'STAT' | 'Urgent' | 'Routine';
  orderedBy: string;
  status: 'Pending' | 'In Analysis' | 'Reported';
  resultValue?: string;
  critical?: boolean;
}

const initialOrders: LabOrder[] = [
  { id: 'LB-901', patientName: 'Kwame Mensah', patientId: 'PT-10935', testName: 'Cardiac Troponin I', urgency: 'STAT', orderedBy: 'Dr. Kwame Addo', status: 'Pending' },
  { id: 'LB-902', patientName: 'Ama Serwaa Owusu', patientId: 'PT-10942', testName: 'Arterial Blood Gas (ABG)', urgency: 'STAT', orderedBy: 'Dr. Naa Lartey', status: 'Reported', resultValue: 'pH 7.31 / pO2 68 / pCO2 48', critical: true },
  { id: 'LB-903', patientName: 'Esi Boateng', patientId: 'PT-10898', testName: 'Neonatal Bilirubin & CBC', urgency: 'Urgent', orderedBy: 'Dr. Tetteh', status: 'In Analysis' },
  { id: 'LB-904', patientName: 'Yaw Adjei', patientId: 'PT-10861', testName: 'Coagulation Profile (PT/INR)', urgency: 'Routine', orderedBy: 'Ridge PolyClinic', status: 'Pending' },
];

export function LabDashboard() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profile } = useAuth();

  const [orders, setOrders] = useState<LabOrder[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [resultInput, setResultInput] = useState('');
  const [isCritical, setIsCritical] = useState(false);

  function handleReportResult() {
    if (!selectedOrder || !resultInput.trim()) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? { ...o, status: 'Reported', resultValue: resultInput.trim(), critical: isCritical }
          : o,
      ),
    );
    setSelectedOrder(null);
    setResultInput('');
    setIsCritical(false);
  }

  const statCount = orders.filter((o) => o.urgency === 'STAT' && o.status !== 'Reported').length;

  return (
    <View style={styles.container}>
      <RoleSwitcherBanner />

      {/* Lab Hero Card */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.heroTop}>
          <View style={styles.labInfo}>
            <View style={styles.badgeRow}>
              <View style={[styles.labBadge, { backgroundColor: '#ECFDF5' }]}>
                <AppIcon ios="cross.vial.fill" android="science" color="#059669" size={14} />
                <Text style={styles.labBadgeText}>Laboratory & Diagnostic Services</Text>
              </View>
              <Text style={[styles.facilityText, { color: colors.textSecondary }]}>
                {profile?.facilityName || 'Korle Bu Pathology & Diagnostics'}
              </Text>
            </View>

            <Text style={[styles.labTechName, { color: colors.text }]}>
              {profile?.displayName || 'Akosua Darko'}
            </Text>
            <Text style={[styles.labSub, { color: colors.textSecondary }]}>
              Specimen Reception · STAT Diagnostic Panels · Direct EHR Critical Value Flagging
            </Text>
          </View>
        </View>

        {/* Rapid Metrics */}
        <View style={[styles.metricsRow, { borderTopColor: colors.border }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: colors.danger }]}>{statCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>STAT Transfers Waiting</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: colors.primary }]}>22 Mins</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Avg STAT Turnaround</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: colors.text }]}>99.4%</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Quality Control Verified</Text>
          </View>
        </View>
      </View>

      {/* Result Entry Modal / Drawer */}
      {selectedOrder && (
        <View
          style={[
            styles.entryCard,
            { backgroundColor: colors.surface, borderColor: colors.primary },
          ]}>
          <View style={styles.entryHeader}>
            <View>
              <Text style={[styles.entryTitle, { color: colors.text }]}>
                Publish Diagnostic Finding: {selectedOrder.testName}
              </Text>
              <Text style={[styles.entrySub, { color: colors.textSecondary }]}>
                Patient: {selectedOrder.patientName} ({selectedOrder.patientId}) · Requisition: {selectedOrder.id}
              </Text>
            </View>
            <Pressable onPress={() => setSelectedOrder(null)}>
              <AppIcon ios="xmark" android="close" color={colors.textSecondary} size={16} />
            </Pressable>
          </View>

          <View style={styles.entryForm}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Quantitative / Qualitative Value
            </Text>
            <TextInput
              value={resultInput}
              onChangeText={setResultInput}
              placeholder="e.g. 1.48 ng/mL (High / Above Reference Range)"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.resultInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
              ]}
            />

            <Pressable
              onPress={() => setIsCritical((c) => !c)}
              style={[
                styles.criticalToggle,
                { backgroundColor: isCritical ? colors.dangerSoft : colors.backgroundElement },
              ]}>
              <AppIcon
                ios="exclamationmark.triangle.fill"
                android="warning"
                color={isCritical ? colors.danger : colors.textSecondary}
                size={16}
              />
              <Text
                style={[
                  styles.criticalText,
                  { color: isCritical ? colors.danger : colors.textSecondary },
                  isCritical && { fontWeight: '800' },
                ]}>
                Flag as Critical Panic Value (Instantly alerts receiving Specialist)
              </Text>
            </Pressable>

            <Pressable
              onPress={handleReportResult}
              style={({ pressed }) => [
                styles.publishBtn,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}>
              <AppIcon ios="checkmark.shield.fill" android="check_circle" color="#FFFFFF" size={15} />
              <Text style={styles.publishBtnText}>Sign Off & Broadcast Result</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Orders List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Incoming Transfer Diagnostic Requisitions
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Lab panels required before transfer intake or surgery
            </Text>
          </View>
        </View>

        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {orders.map((order, idx) => (
            <View
              key={order.id}
              style={[
                styles.orderRow,
                idx < orders.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}>
              <View style={styles.orderMain}>
                <View style={styles.orderTopLine}>
                  <Text style={[styles.orderTest, { color: colors.text }]}>{order.testName}</Text>
                  <View
                    style={[
                      styles.urgencyBadge,
                      {
                        backgroundColor:
                          order.urgency === 'STAT'
                            ? colors.dangerSoft
                            : order.urgency === 'Urgent'
                              ? colors.accentSoft
                              : colors.backgroundElement,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.urgencyText,
                        {
                          color:
                            order.urgency === 'STAT'
                              ? colors.danger
                              : order.urgency === 'Urgent'
                                ? colors.accent
                                : colors.textSecondary,
                        },
                      ]}>
                      {order.urgency}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.orderPatient, { color: colors.textSecondary }]}>
                  {order.patientName} ({order.patientId}) · Ordered by: {order.orderedBy}
                </Text>

                {order.resultValue && (
                  <View
                    style={[
                      styles.resultDisplay,
                      { backgroundColor: order.critical ? colors.dangerSoft : colors.primarySoft },
                    ]}>
                    <Text
                      style={[
                        styles.resultDisplayText,
                        { color: order.critical ? colors.danger : colors.primary },
                      ]}>
                      Result: {order.resultValue} {order.critical ? '⚠️ CRITICAL VALUE' : '✓ Verified'}
                    </Text>
                  </View>
                )}
              </View>

              {order.status !== 'Reported' && (
                <Pressable
                  onPress={() => {
                    setSelectedOrder(order);
                    setResultInput('');
                  }}
                  style={({ pressed }) => [
                    styles.enterBtn,
                    { backgroundColor: colors.primarySoft, borderColor: colors.primary },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.enterBtnText, { color: colors.primary }]}>Enter Result</Text>
                </Pressable>
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
  labInfo: {
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  labBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  facilityText: {
    fontSize: 11,
  },
  labTechName: {
    fontSize: 18,
    fontWeight: '800',
  },
  labSub: {
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
  entryCard: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  entrySub: {
    fontSize: 11,
    marginTop: 2,
  },
  entryForm: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  resultInput: {
    borderWidth: 1,
    borderRadius: 6,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  criticalToggle: {
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  criticalText: {
    fontSize: 11,
    flex: 1,
  },
  publishBtn: {
    height: 40,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
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
  listCard: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  orderRow: {
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderMain: {
    flex: 1,
    gap: 3,
  },
  orderTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderTest: {
    fontSize: 13,
    fontWeight: '800',
  },
  urgencyBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  urgencyText: {
    fontSize: 9,
    fontWeight: '800',
  },
  orderPatient: {
    fontSize: 11,
  },
  resultDisplay: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 3,
  },
  resultDisplayText: {
    fontSize: 11,
    fontWeight: '700',
  },
  enterBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  enterBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
