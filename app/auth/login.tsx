import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { AuthCard } from '../../src/components/auth/AuthCard';
import { Screen } from '../../src/components/ui/Screen';
import { spacing } from '../../src/config/theme';

export default function LoginScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const initialTab = tab === 'signup' ? 'signup' : 'signin';

  return (
    <Screen scroll showLanguageToggle>
      <View style={styles.wrap}>
        <AuthCard initialTab={initialTab} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.lg,
  },
});
