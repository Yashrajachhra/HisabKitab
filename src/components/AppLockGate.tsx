import { useEffect, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { spacing, typography } from '../config/theme';
import { makeStyles } from '../theme/ThemeProvider';
import { authenticateWithBiometrics, isAppLockEnabled, verifyAppPin } from '../services/appLock';
import { HkLogo } from './HkLogo';
import { Button } from './ui/Button';
import { ThemeToggle } from './ui/HeaderToggles';
import { TextField } from './ui/TextField';

type AppLockGateProps = {
  children: ReactNode;
};

export function AppLockGate({ children }: AppLockGateProps) {
  const styles = useStyles();
  const [required, setRequired] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const enabled = await isAppLockEnabled();
        setRequired(enabled);
        if (!enabled) {
          setUnlocked(true);
          return;
        }
        const bio = await authenticateWithBiometrics();
        if (bio) setUnlocked(true);
        // If biometrics fails/unavailable, keep PIN unlock UI (do not spin forever).
      } catch {
        setRequired(false);
        setUnlocked(true);
      }
    })();
  }, []);

  if (!required || unlocked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.toggle}>
        <ThemeToggle />
      </View>
      <View style={styles.inner}>
        <HkLogo size={56} style={styles.logo} />
        <Text style={styles.title}>HisabKitab</Text>
        <Text style={styles.sub}>Enter PIN to unlock. Data stays on this device.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextField
          label="PIN"
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          secureTextEntry
        />
        <Button
          label="Unlock"
          onPress={() => {
            void (async () => {
              const ok = await verifyAppPin(pin);
              if (ok) {
                setUnlocked(true);
                setError(null);
              } else {
                setError('Incorrect PIN');
              }
            })();
          }}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  toggle: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
  },
  inner: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  logo: { marginBottom: spacing.md },
  title: { ...typography.brand, color: colors.text, marginBottom: spacing.sm },
  sub: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  error: { color: colors.danger, marginBottom: spacing.sm },
}));
