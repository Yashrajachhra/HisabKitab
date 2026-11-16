import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { HkLogo } from '../HkLogo';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';
import { radii, spacing, typography } from '../../config/theme';
import { makeStyles } from '../../theme/ThemeProvider';
import { getApiBaseUrl, isLocalApiUrl } from '../../services/api/client';
import { useAuthStore } from '../../store/authStore';

type AuthTab = 'signin' | 'signup';

type AuthCardProps = {
  initialTab?: AuthTab;
};

export function AuthCard({ initialTab = 'signin' }: AuthCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isLocalApiUrl()) {
        setError(t('auth.serverUnreachableLocal'));
        return;
      }
      if (tab === 'signin') {
        if (!email.trim() || !password) {
          setError(t('auth.requiredFields'));
          return;
        }
        await login({ email: email.trim(), password });
      } else {
        const name = displayName.trim();
        const mail = email.trim();
        if (name.length < 2) {
          setError(t('auth.displayNameTooShort'));
          return;
        }
        if (!mail.includes('@')) {
          setError(t('auth.emailInvalid'));
          return;
        }
        if (password.length < 8) {
          setError(t('auth.passwordTooShort'));
          return;
        }
        await register({
          displayName: name,
          email: mail,
          password,
        });
      }
      router.replace('/groups' as Href);
    } catch (err) {
      const raw = err instanceof Error ? err.message : t('common.error');
      if (/CLEARTEXT|UnknownServiceException|Network request failed|Failed to fetch|ECONNREFUSED/i.test(raw)) {
        setError(t('auth.serverUnreachable', { url: getApiBaseUrl() }));
      } else {
        setError(raw);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <HkLogo size={56} style={styles.logo} />
      <Text style={styles.title}>{t('auth.welcome')}</Text>
      <Text style={styles.hint}>
        {tab === 'signin' ? t('auth.loginHint') : t('auth.registerHint')}
      </Text>

      <View style={styles.tabs} accessibilityRole="tablist">
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'signin' }}
          onPress={() => setTab('signin')}
          style={[styles.tab, tab === 'signin' ? styles.tabActive : null]}
        >
          <Text style={[styles.tabLabel, tab === 'signin' ? styles.tabLabelActive : null]}>
            {t('auth.login')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'signup' }}
          onPress={() => setTab('signup')}
          style={[styles.tab, tab === 'signup' ? styles.tabActive : null]}
        >
          <Text style={[styles.tabLabel, tab === 'signup' ? styles.tabLabelActive : null]}>
            {t('auth.register')}
          </Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {tab === 'signup' ? (
        <TextField
          label={t('auth.displayName')}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t('auth.displayNamePlaceholder')}
        />
      ) : null}
      <TextField
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <TextField
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        showVisibilityToggle
        placeholder={t('auth.passwordPlaceholder')}
      />

      <Button
        label={tab === 'signin' ? t('auth.login') : t('auth.register')}
        loading={loading}
        onPress={() => void onSubmit()}
      />

      <Text style={styles.legal}>{t('auth.legal')}</Text>

      <Button
        label={t('common.back')}
        variant="ghost"
        style={styles.back}
        onPress={() => router.back()}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  logo: { alignSelf: 'center', marginBottom: spacing.md },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.onPrimary,
  },
  error: { color: colors.danger, marginBottom: spacing.sm },
  legal: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  back: { marginTop: spacing.sm },
}));
