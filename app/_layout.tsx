import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '../src/i18n';
import { AppLockGate } from '../src/components/AppLockGate';
import { makeStyles, ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { useAppStore } from '../src/store/appStore';
import { useAuthStore } from '../src/store/authStore';
import { useOnboardingStore } from '../src/store/onboardingStore';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { colors, scheme } = useTheme();
  const statusBarStyle = scheme === 'dark' ? 'light' : 'dark';
  const styles = useStyles();
  const router = useRouter();
  const segments = useSegments();
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);
  const loadOnboarding = useOnboardingStore((s) => s.load);
  const onboardingReady = useOnboardingStore((s) => s.ready);
  const onboardingComplete = useOnboardingStore((s) => s.complete);
  const hydrateAuth = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    // Boot must always complete; individual loaders catch their own errors.
    void Promise.allSettled([loadOnboarding(), hydrate(), hydrateAuth()]);
  }, [hydrate, loadOnboarding, hydrateAuth]);

  // Hard failsafe: never leave the UI on an infinite spinner (e.g. SQLite web hang).
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!useAppStore.getState().hydrated) {
        useAppStore.setState({
          hydrated: true,
          isLoading: false,
          error: 'Local database took too long to open. Try refreshing.',
        });
      }
      if (!useOnboardingStore.getState().ready) {
        useOnboardingStore.setState({ ready: true, complete: false });
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!onboardingReady || !hydrated) return;

    const onOnboarding = segments[0] === 'onboarding';
    if (!onboardingComplete && !onOnboarding) {
      router.replace('/onboarding');
      return;
    }
    if (onboardingComplete && onOnboarding) {
      router.replace('/');
    }
  }, [onboardingReady, hydrated, onboardingComplete, segments, router]);

  if (!onboardingReady || !hydrated) {
    return (
      <View style={styles.boot} accessibilityLabel="Loading HisabKitab">
        <ActivityIndicator size="large" color={colors.primary} />
        <StatusBar style={statusBarStyle} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <AppLockGate>
        <StatusBar style={statusBarStyle} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="dashboard/index" />
          <Stack.Screen name="expense/manual" options={{ presentation: 'modal' }} />
          <Stack.Screen name="expense/ocr" options={{ presentation: 'modal' }} />
          <Stack.Screen name="expense/ocr-confirm" options={{ presentation: 'modal' }} />
          <Stack.Screen name="expense/voice" options={{ presentation: 'modal' }} />
          <Stack.Screen name="expense/voice-confirm" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/register" options={{ presentation: 'modal' }} />
          <Stack.Screen name="groups/index" />
          <Stack.Screen name="groups/[id]" />
          <Stack.Screen name="settings/index" />
        </Stack>
      </AppLockGate>
    </GestureHandlerRootView>
  );
}

const useStyles = makeStyles((colors) => ({
  flex: { flex: 1 },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
}));
