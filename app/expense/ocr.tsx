import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

import { Button } from '../../src/components/ui/Button';
import { Screen } from '../../src/components/ui/Screen';
import { radii, spacing, typography } from '../../src/config/theme';
import { makeStyles, useTheme } from '../../src/theme/ThemeProvider';
import {
  OcrLimitError,
  OcrNativeUnavailableError,
  scanReceiptImage,
} from '../../src/services/ocr';
import { ensureMediaPermission } from '../../src/services/ocr/permissions';
import { useOcrDraftStore } from '../../src/store/ocrDraftStore';

type UiError = {
  title: string;
  body: string;
};

export default function OcrCaptureScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const setFromScan = useOcrDraftStore((s) => s.setFromScan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<UiError | null>(null);
  const [cameraDeniedHint, setCameraDeniedHint] = useState(false);

  const processUri = async (uri: string) => {
    setBusy(true);
    setError(null);
    try {
      const scan = await scanReceiptImage(uri);
      setFromScan(scan);
      router.push('/expense/ocr-confirm' as Href);
    } catch (err) {
      if (err instanceof OcrLimitError) {
        setError({
          title: t('ocr.limitTitle'),
          body: t('ocr.limitBody', { limit: err.status.limit }),
        });
      } else if (err instanceof OcrNativeUnavailableError) {
        setError({
          title: t('ocr.nativeTitle'),
          body: t('ocr.nativeBody'),
        });
      } else {
        setError({
          title: t('ocr.failedTitle'),
          body: t('ocr.failedBody'),
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const openCamera = async () => {
    setError(null);
    const permission = await ensureMediaPermission('camera');
    if (!permission.granted) {
      setCameraDeniedHint(true);
      setError({
        title: t('ocr.cameraDeniedTitle'),
        body: t('ocr.cameraDeniedBody'),
      });
      return;
    }
    setCameraDeniedHint(false);
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
      exif: false,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    await processUri(result.assets[0].uri);
  };

  const openGallery = async () => {
    setError(null);
    const permission = await ensureMediaPermission('gallery');
    if (!permission.granted) {
      setError({
        title: t('ocr.galleryDeniedTitle'),
        body: t('ocr.galleryDeniedBody'),
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: false,
      exif: false,
      mediaTypes: ['images'],
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    await processUri(result.assets[0].uri);
  };

  return (
    <Screen title={t('ocr.title')}>
      <Text style={styles.privacy}>{t('ocr.privacy')}</Text>

      {error ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorTitle}>{error.title}</Text>
          <Text style={styles.errorBody}>{error.body}</Text>
          {cameraDeniedHint ? <Text style={styles.errorHint}>{t('ocr.tryGallery')}</Text> : null}
        </View>
      ) : null}

      {busy ? (
        <View style={styles.busy}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.busyText}>{t('ocr.reading')}</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <Button label={t('ocr.camera')} onPress={() => void openCamera()} />
          <Button
            label={t('ocr.gallery')}
            variant="secondary"
            onPress={() => void openGallery()}
            style={styles.gap}
          />
        </View>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  privacy: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  actions: {
    marginTop: spacing.md,
  },
  gap: {
    marginTop: spacing.sm,
  },
  busy: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  busyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
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
  errorHint: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
}));
