import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

type AppIconProps = {
  ios: SymbolViewProps['name'] extends infer T
    ? T extends string
      ? T
      : never
    : never;
  android: Exclude<SymbolViewProps['name'], string> extends { android?: infer T } ? T : never;
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function AppIcon({ ios, android, color, size = 20, style }: AppIconProps) {
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      tintColor={color}
      size={size}
      style={style}
      fallback={null}
    />
  );
}
