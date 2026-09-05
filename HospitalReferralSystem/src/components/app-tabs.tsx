import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      iconColor={{ default: colors.textSecondary, selected: colors.primary }}
      indicatorColor={colors.primarySoft}
      labelStyle={{
        default: { color: colors.textSecondary, fontSize: 11 },
        selected: { color: colors.primary, fontSize: 11, fontWeight: '700' },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Overview</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }}
          md="dashboard"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="referrals">
        <NativeTabs.Trigger.Label>Referrals</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="arrow.left.arrow.right" md="swap_horiz" />
        <NativeTabs.Trigger.Badge>2</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="resources">
        <NativeTabs.Trigger.Label>Capacity</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bed.double" md="bed" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
