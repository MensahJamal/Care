import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { AppRole, ROLE_DEFINITIONS } from '@/constants/roles';
import { useAuth } from '@/context/auth-context';

const items = [
  { name: 'overview', href: '/', label: 'Overview', ios: 'square.grid.2x2', android: 'dashboard' },
  {
    name: 'referrals',
    href: '/referrals',
    label: 'Referrals',
    ios: 'arrow.left.arrow.right',
    android: 'swap_horiz',
  },
  { name: 'capacity', href: '/resources', label: 'Capacity', ios: 'bed.double', android: 'bed' },
  { name: 'account', href: '/account', label: 'Account', ios: 'person', android: 'person' },
] as const;

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          {items.map((item) => (
            <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
              <TabButton icon={item}>
                {item.label}
              </TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: (typeof items)[number];
};

function TabButton({ children, isFocused, icon, ...props }: TabButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && { backgroundColor: colors.primarySoft },
        pressed && styles.pressed,
      ]}>
      <AppIcon
        ios={icon.ios}
        android={icon.android}
        color={isFocused ? colors.primary : colors.textSecondary}
        size={19}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? colors.primary : colors.textSecondary },
          isFocused && styles.tabLabelActive,
        ]}>
        {children}
      </Text>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profile } = useAuth();

  const currentRole = (profile?.role as AppRole) || 'pcp';
  const roleMeta = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.pcp;
  const facilityName = profile?.facilityName
    ? profile.facilityName.split(' ')[0]
    : 'Korle Bu';

  return (
    <View {...props} style={[styles.tabListContainer, { borderColor: colors.border }]}>
      <View style={[styles.innerContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.brand}>
          <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
            <Text style={styles.brandCross}>+</Text>
          </View>
          <Text style={[styles.brandText, { color: colors.text }]}>CareLink</Text>
        </View>

        <View style={styles.links}>{props.children}</View>

        <View style={styles.facilityCluster}>
          <View
            style={[
              styles.roleTag,
              {
                backgroundColor: roleMeta.badgeColor.bg,
                borderColor: roleMeta.badgeColor.border,
              },
            ]}>
            <AppIcon
              ios={roleMeta.icon.ios}
              android={roleMeta.icon.android}
              color={roleMeta.badgeColor.text}
              size={12}
            />
            <Text style={[styles.roleTagText, { color: roleMeta.badgeColor.text }]}>
              {roleMeta.shortTitle}
            </Text>
          </View>

          <View style={styles.facility}>
            <Text style={[styles.facilityLabel, { color: colors.textSecondary }]}>Facility Node</Text>
            <Text numberOfLines={1} style={[styles.facilityName, { color: colors.text }]}>
              {facilityName}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    minHeight: 72,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  innerContainer: {
    width: '100%',
    maxWidth: MaxContentWidth,
    minHeight: 71,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, marginRight: 'auto' },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCross: { color: '#FFFFFF', fontSize: 22, lineHeight: 24, fontWeight: '500' },
  brandText: { fontSize: 17, fontWeight: '800', letterSpacing: 0 },
  links: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabButton: {
    minWidth: 82,
    height: 48,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 10,
  },
  tabLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0 },
  tabLabelActive: { fontWeight: '800' },
  facilityCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 'auto',
  },
  roleTag: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  facility: { alignItems: 'flex-end' },
  facilityLabel: { fontSize: 9, letterSpacing: 0 },
  facilityName: { fontSize: 12, fontWeight: '700', letterSpacing: 0 },
  pressed: { opacity: 0.65 },
});
