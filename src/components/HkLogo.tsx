import { Image, StyleSheet, View, type ViewStyle } from 'react-native';

import logoMark from '../../assets/logo-mark.png';

type HkLogoProps = {
  size?: number;
  style?: ViewStyle;
};

export function HkLogo({ size = 48, style }: HkLogoProps) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="HisabKitab"
      style={[styles.box, { width: size, height: size }, style]}
    >
      <Image source={logoMark} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
