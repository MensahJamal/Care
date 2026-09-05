import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { ReferralStatus } from '@/context/referral-context';

export function StatusPill({ status }: { status: ReferralStatus }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const tone =
    status === 'Accepted'
      ? [colors.primarySoft, colors.primary]
      : status === 'Rejected'
        ? [colors.dangerSoft, colors.danger]
        : status === 'In transit'
          ? [colors.infoSoft, colors.info]
          : [colors.accentSoft, colors.accent];

  return (
    <View style={[styles.pill, { backgroundColor: tone[0] }]}>
      <View style={[styles.dot, { backgroundColor: tone[1] }]} />
      <Text style={[styles.text, { color: tone[1] }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 25,
    borderRadius: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0 },
});
