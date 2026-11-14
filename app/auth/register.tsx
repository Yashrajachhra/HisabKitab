import { StyleSheet, View } from 'react-native';

import { AuthCard } from '../../src/components/auth/AuthCard';
import { Screen } from '../../src/components/ui/Screen';
import { spacing } from '../../src/config/theme';

export default function RegisterScreen() {
  return (
    <Screen scroll showLanguageToggle>
      <View style={styles.wrap}>
        <AuthCard initialTab="signup" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.lg,
  },
});
