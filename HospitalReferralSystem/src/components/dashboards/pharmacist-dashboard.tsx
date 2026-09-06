import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { RoleSwitcherBanner } from './role-switcher-banner';

interface PrescriptionOrder {
  id: string;
  patientName: string;
  patientId: string;
  medication: string;
  dosage: string;
  route: string;
  prescribedBy: string;
  status: 'Awaiting Review' | 'Dispensed' | 'Interaction Flagged';
  notes: string;
}

const initialPrescriptions: PrescriptionOrder[] = [
  { id: 'RX-701', patientName: 'Ama Serwaa Owusu', patientId: 'PT-10942', medication: 'Salbutamol Nebulizer Solution + Hydrocortisone IV', dosage: '5mg stat, 100mg IV', route: 'Nebulized / IV', prescribedBy: 'Dr. Kwame Addo', status: 'Awaiting Review', notes: 'Emergency transfer for acute respiratory distress' },
  { id: 'RX-702', patientName: 'Kwame Mensah', patientId: 'PT-10935', medication: 'Aspirin 300mg + Clopidogrel 300mg Loading', dosage: 'Stat PO', route: 'Oral', prescribedBy: 'Dr. Naa Lartey', status: 'Awaiting Review', notes: 'Suspected acute coronary syndrome, verify GI bleed history' },
  { id: 'RX-703', patientName: 'Esi Boateng', patientId: 'PT-10898', medication: 'Ampicillin + Gentamicin Pediatric IV', dosage: 'Weight-based neonatal dose', route: 'IV Infusion', prescribedBy: 'NICU Specialist', status: 'Dispensed', notes: 'Checked against neonatal kidney clearance' },
];

const formularyItems = [
  { name: 'Norepinephrine 4mg/4mL Ampoules', stock: '28 Ampoules', status: 'Adequate', alert: false },
  { name: 'Tenecteplase (TNK-tPA) 50mg Vials', stock: '4 Vials', status: 'Critical Reserve', alert: true },
  { name: 'Polyvalent Snake Antivenom (African)', stock: '12 Vials', status: 'Adequate', alert: false },
  { name: 'Packed O-Negative Red Blood Cells', stock: '6 Units', status: 'Limited', alert: true },
];

export function PharmacistDashboard() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profile } = useAuth();

  const [prescriptions, setPrescriptions] = useState<PrescriptionOrder[]>(initialPrescriptions);

  function handleApproveDispense(id: string) {
    setPrescriptions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Dispensed' } : p)),
    );
  }

  function handleFlagInteraction(id: string) {
    setPrescriptions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Interaction Flagged' } : p)),
    );
  }

  const pendingCount = prescriptions.filter((p) => p.status === 'Awaiting Review').length;

  return (
    <View style={styles.container}>
      <RoleSwitcherBanner />

      {/* Pharmacist Hero Card */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.heroTop}>
          <View style={styles.pharmInfo}>
            <View style={styles.badgeRow}>
              <View style={[styles.pharmBadge, { backgroundColor: '#FEF3C7' }]}>
                <AppIcon ios="pills.fill" android="medication" color="#B45309" size={14} />
                <Text style={styles.pharmBadgeText}>Hospital Pharmacy & Formulary Portal</Text>
              </View>
              <Text style={[styles.facilityText, { color: colors.textSecondary }]}>
                {profile?.facilityName || 'Korle Bu Central Pharmacy'}
              </Text>
            </View>

            <Text style={[styles.pharmName, { color: colors.text }]}>
              {profile?.displayName || 'Pharm. David Osei'}
            </Text>
            <Text style={[styles.pharmSub, { color: colors.textSecondary }]}>
              Medication Reconciliation · High-Alert Drug Verification · Emergency Stock Custody
            </Text>
          </View>
        </View>

        {/* Rapid Metrics */}
        <View style={[styles.metricsRow, { borderTopColor: colors.border }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: colors.accent }]}>{pendingCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Transfers Awaiting Med Rec</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: colors.primary }]}>100%</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Allergy Clearance</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: colors.danger }]}>2 Items</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Critical Stock Alerts</Text>
          </View>
        </View>
      </View>

      {/* Medication Reconciliation Queue */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Transfer Patient Medication Reconciliation Queue
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Review drug regimens prescribed before and during inter-hospital transit
            </Text>
          </View>
        </View>

        <View style={styles.queueList}>
          {prescriptions.map((rx) => (
            <View
              key={rx.id}
              style={[
                styles.rxCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <View style={styles.rxHeader}>
                <View>
                  <Text style={[styles.rxPatient, { color: colors.text }]}>
                    {rx.patientName} ({rx.patientId})
                  </Text>
                  <Text style={[styles.rxMeta, { color: colors.textSecondary }]}>
                    Requisition: {rx.id} · Prescriber: {rx.prescribedBy}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        rx.status === 'Dispensed'
                          ? colors.primarySoft
                          : rx.status === 'Interaction Flagged'
                            ? colors.dangerSoft
                            : colors.accentSoft,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          rx.status === 'Dispensed'
                            ? colors.primary
                            : rx.status === 'Interaction Flagged'
                              ? colors.danger
                              : colors.accent,
                      },
                    ]}>
                    {rx.status}
                  </Text>
                </View>
              </View>

              <View style={[styles.rxDetailsBox, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.medName, { color: colors.text }]}>{rx.medication}</Text>
                <Text style={[styles.dosageText, { color: colors.textSecondary }]}>
                  Dosage: {rx.dosage} · Route: {rx.route}
                </Text>
                <Text style={[styles.clinicalNotes, { color: colors.textSecondary }]}>
                  Clinical Context: {rx.notes}
                </Text>
              </View>

              {rx.status === 'Awaiting Review' && (
                <View style={styles.rxActions}>
                  <Pressable
                    onPress={() => handleFlagInteraction(rx.id)}
                    style={({ pressed }) => [
                      styles.flagBtn,
                      { borderColor: colors.danger },
                      pressed && styles.pressed,
                    ]}>
                    <AppIcon ios="exclamationmark.triangle" android="warning" color={colors.danger} size={14} />
                    <Text style={[styles.flagText, { color: colors.danger }]}>Flag Interaction</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleApproveDispense(rx.id)}
                    style={({ pressed }) => [
                      styles.approveBtn,
                      { backgroundColor: colors.primary },
                      pressed && styles.pressed,
                    ]}>
                    <AppIcon ios="checkmark.shield.fill" android="check" color="#FFFFFF" size={14} />
                    <Text style={styles.approveText}>Verify & Authorize Dispense</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Emergency Stock Tracker */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Emergency Referral Formulary Reserves
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Live counts of critical emergency pharmaceuticals for transfer patients
            </Text>
          </View>
        </View>

        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {formularyItems.map((item, idx) => (
            <View
              key={item.name}
              style={[
                styles.stockRow,
                idx < formularyItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}>
              <View style={[styles.stockIcon, { backgroundColor: item.alert ? colors.dangerSoft : colors.primarySoft }]}>
                <AppIcon
                  ios="cross.case.fill"
                  android="medical_services"
                  color={item.alert ? colors.danger : colors.primary}
                  size={16}
                />
              </View>
              <View style={styles.stockBody}>
                <Text style={[styles.stockName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.stockCount, { color: colors.textSecondary }]}>{item.stock}</Text>
              </View>
              <View
                style={[
                  styles.stockBadge,
                  { backgroundColor: item.alert ? colors.dangerSoft : colors.primarySoft },
                ]}>
                <Text
                  style={[
                    styles.stockBadgeText,
                    { color: item.alert ? colors.danger : colors.primary },
                  ]}>
                  {item.status}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pharmInfo: {
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pharmBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pharmBadgeText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
  },
  facilityText: {
    fontSize: 11,
  },
  pharmName: {
    fontSize: 18,
    fontWeight: '800',
  },
  pharmSub: {
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
  queueList: {
    gap: 12,
  },
  rxCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.four,
    gap: 10,
  },
  rxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rxPatient: {
    fontSize: 14,
    fontWeight: '800',
  },
  rxMeta: {
    fontSize: 11,
  },
  statusPill: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  rxDetailsBox: {
    borderRadius: 8,
    padding: 10,
    gap: 3,
  },
  medName: {
    fontSize: 13,
    fontWeight: '800',
  },
  dosageText: {
    fontSize: 11,
  },
  clinicalNotes: {
    fontSize: 10,
  },
  rxActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  flagBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  flagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  approveBtn: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  approveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  listCard: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  stockRow: {
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stockIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBody: {
    flex: 1,
    gap: 2,
  },
  stockName: {
    fontSize: 13,
    fontWeight: '700',
  },
  stockCount: {
    fontSize: 11,
  },
  stockBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
