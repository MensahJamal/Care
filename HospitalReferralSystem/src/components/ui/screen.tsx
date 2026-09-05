import { PropsWithChildren, ReactNode } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';

type ScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  action?: ReactNode;
  contentStyle?: ViewStyle;
}>;

export function Screen({ title, subtitle, action, children, contentStyle }: ScreenProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: Platform.OS === 'web' ? 92 : insets.top + Spacing.three,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.six,
        },
      ]}>
      <View style={[styles.content, contentStyle]}>
        <View style={styles.header}>
          <View style={styles.heading}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
            ) : null}
          </View>
          {action}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.six,
  },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  heading: { flex: 1, gap: 3 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: 0 },
  subtitle: { fontSize: 13, lineHeight: 18, letterSpacing: 0 },
});
