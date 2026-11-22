import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useTranslation } from 'react-i18next';

import { Button } from '../../src/components/ui/Button';
import { Screen } from '../../src/components/ui/Screen';
import { TextField } from '../../src/components/ui/TextField';
import { radii, spacing, typography } from '../../src/config/theme';
import { makeStyles } from '../../src/theme/ThemeProvider';
import { parseVoiceExpense } from '../../src/features/voice/parseVoiceExpense';
import { VoiceNativeUnavailableError } from '../../src/services/voice';
import { ensureSpeechPermission } from '../../src/services/voice/permissions';
import { useVoiceDraftStore } from '../../src/store/voiceDraftStore';

type UiError = { title: string; body: string };

function probeSpeechAvailable(): boolean {
  try {
    return Platform.OS !== 'web' && ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
}

function probeOnDeviceSpeech(): boolean {
  try {
    return ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
  } catch {
    return false;
  }
}

export default function VoiceCaptureScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const setFromParse = useVoiceDraftStore((s) => s.setFromParse);

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechReady, setSpeechReady] = useState(false);
  const [preferOnDevice, setPreferOnDevice] = useState(false);
  const [error, setError] = useState<UiError | null>(null);

  useEffect(() => {
    const available = probeSpeechAvailable();
    const onDevice = available && probeOnDeviceSpeech();
    setSpeechReady(available);
    setPreferOnDevice(onDevice);
    setError(null);
  }, []);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const next = event.results[0]?.transcript?.trim() ?? '';
    if (next) setTranscript(next);
  });
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    if (event.error === 'not-allowed') {
      setError({
        title: t('voice.micDeniedTitle'),
        body: t('voice.micDeniedBody'),
      });
      return;
    }
    if (event.error === 'service-not-allowed' || event.error === 'language-not-supported') {
      setError({
        title: t('voice.failedTitle'),
        body: t('voice.failedBody'),
      });
      return;
    }
    setError({
      title: t('voice.failedTitle'),
      body: t('voice.failedBody'),
    });
  });

  useEffect(() => {
    return () => {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // ignore teardown errors
      }
    };
  }, []);

  const startListening = async () => {
    setError(null);
    setTranscript('');

    try {
      const permission = await ensureSpeechPermission();
      if (!permission.granted) {
        setError({
          title: t('voice.micDeniedTitle'),
          body: t('voice.micDeniedBody'),
        });
        return;
      }

      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        throw new VoiceNativeUnavailableError();
      }

      const onDevice = probeOnDeviceSpeech();
      setPreferOnDevice(onDevice);

      const startOptions = {
        interimResults: true,
        continuous: false,
        // Prefer on-device when the phone supports it; otherwise allow the
        // device speech service so Voice works on more Android phones.
        requiresOnDeviceRecognition: onDevice,
        addsPunctuation: false,
      } as const;

      try {
        ExpoSpeechRecognitionModule.start({ ...startOptions, lang: 'en-PK' });
      } catch {
        try {
          ExpoSpeechRecognitionModule.start({ ...startOptions, lang: 'en-US' });
        } catch {
          // Last resort: start without forcing on-device.
          ExpoSpeechRecognitionModule.start({
            interimResults: true,
            continuous: false,
            requiresOnDeviceRecognition: false,
            addsPunctuation: false,
            lang: 'en-US',
          });
        }
      }
    } catch (err) {
      setListening(false);
      if (err instanceof VoiceNativeUnavailableError) {
        setSpeechReady(false);
        setError({ title: t('voice.nativeTitle'), body: t('voice.nativeBody') });
        return;
      }
      setError({ title: t('voice.nativeTitle'), body: t('voice.nativeBody') });
    }
  };

  const stopListening = () => {
    ExpoSpeechRecognitionModule.stop();
  };

  const continueToConfirm = () => {
    const parsed = parseVoiceExpense(transcript);
    setFromParse(parsed);
    router.push('/expense/voice-confirm' as Href);
  };

  return (
    <Screen title={t('voice.title')}>
      <Text style={styles.privacy}>
        {preferOnDevice ? t('voice.privacyOnDevice') : t('voice.privacy')}
      </Text>
      <Text style={styles.examples}>{t('voice.examples')}</Text>

      {error ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorTitle}>{error.title}</Text>
          <Text style={styles.errorBody}>{error.body}</Text>
        </View>
      ) : null}

      {!speechReady ? (
        <View style={styles.infoBox} accessibilityRole="summary">
          <Text style={styles.errorTitle}>{t('voice.onDeviceTitle')}</Text>
          <Text style={styles.errorBody}>{t('voice.onDeviceBody')}</Text>
        </View>
      ) : null}

      <View style={[styles.micWrap, listening ? styles.micActive : null]}>
        <Text style={styles.micStatus}>{listening ? t('voice.listening') : t('voice.idle')}</Text>
        <Text style={styles.transcript} accessibilityLiveRegion="polite">
          {transcript || t('voice.placeholder')}
        </Text>
      </View>

      {speechReady ? (
        !listening ? (
          <Button label={t('voice.start')} onPress={() => void startListening()} />
        ) : (
          <Button label={t('voice.stop')} variant="secondary" onPress={stopListening} />
        )
      ) : null}

      <TextField
        label={t('voice.typeFallbackLabel')}
        value={transcript}
        onChangeText={setTranscript}
        placeholder={t('voice.typeFallbackPlaceholder')}
        autoCapitalize="sentences"
      />

      <Button
        label={t('voice.useTranscript')}
        onPress={continueToConfirm}
        disabled={!transcript.trim()}
        style={styles.gap}
      />
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  privacy: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  examples: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  micWrap: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    minHeight: 160,
    marginBottom: spacing.lg,
  },
  micActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  micStatus: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  transcript: {
    ...typography.subtitle,
    color: colors.text,
    lineHeight: 24,
  },
  gap: { marginTop: spacing.sm },
  errorBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoBox: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  errorBody: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
}));
