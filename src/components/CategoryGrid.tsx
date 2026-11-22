import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { categoryVisual, radii, shadows, spacing, typography, withAlpha } from '../config/theme';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import type { Category } from '../db/types';
import { useResponsive } from '../hooks/useResponsive';
import { PressableScale } from './ui/PressableScale';

const GAP = spacing.sm + 2;

type IconName = ComponentProps<typeof Ionicons>['name'];

type CategoryGridProps = {
  categories: Category[];
  onSelect: (category: Category) => void;
  selectedId?: string | null;
  /** Shows a dashed “+ Add” tile so users aren’t stuck with the seed list. */
  onAdd?: () => void;
};

export function CategoryGrid({ categories, onSelect, selectedId, onAdd }: CategoryGridProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const { contentWidth, isTablet } = useResponsive();
  const columns = contentWidth < 270 ? 2 : isTablet ? 4 : 3;
  const itemWidth = Math.floor((contentWidth - GAP * (columns - 1)) / columns);

  return (
    <View style={styles.grid} accessibilityRole="summary">
      {categories.map((category) => {
        const selected = category.id === selectedId;
        const visual = categoryVisual(category);
        return (
          <PressableScale
            key={category.id}
            accessibilityRole="button"
            accessibilityLabel={category.name}
            accessibilityState={{ selected }}
            onPress={() => onSelect(category)}
            style={[
              styles.item,
              { width: itemWidth },
              selected
                ? { borderColor: visual.color, backgroundColor: withAlpha(visual.color, 0.14) }
                : null,
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: visual.bgColor }]}>
              <Ionicons name={visual.icon as IconName} size={22} color={visual.color} />
            </View>
            <Text
              style={[styles.name, selected ? { color: visual.color, fontWeight: '700' } : null]}
              numberOfLines={1}
            >
              {category.name}
            </Text>
          </PressableScale>
        );
      })}
      {onAdd ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t('settings.addCategory')}
          onPress={onAdd}
          style={[styles.item, styles.addItem, { width: itemWidth }]}
        >
          <View style={[styles.iconWrap, styles.addIconWrap]}>
            <Ionicons name="add" size={24} color={colors.primaryDark} />
          </View>
          <Text style={styles.addLabel} numberOfLines={1}>
            {t('settings.addCategory')}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    ...shadows.soft,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.labelMd,
    color: colors.text,
  },
  addItem: {
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    ...shadows.none,
  },
  addIconWrap: {
    backgroundColor: colors.primaryMuted,
  },
  addLabel: {
    ...typography.labelMd,
    color: colors.primaryDark,
    fontWeight: '700',
  },
}));
