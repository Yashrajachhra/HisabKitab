import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radii, spacing, typography } from '../config/theme';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import type { Category } from '../db/types';
import { useResponsive } from '../hooks/useResponsive';

const GAP = spacing.sm;

type CategoryGridProps = {
  categories: Category[];
  onSelect: (category: Category) => void;
  selectedId?: string | null;
  /** Shows a dashed “+ Add” tile so users aren’t stuck with the seed list. */
  onAdd?: () => void;
};

const ICON_GLYPH: Record<string, string> = {
  cup: 'C',
  food: 'F',
  bus: 'T',
  print: 'P',
  home: 'H',
  phone: 'M',
  pen: 'S',
};

function categoryGlyph(category: Category): string {
  const mapped = ICON_GLYPH[category.icon];
  if (mapped) return mapped;
  // Custom / “dots” / single-letter icons → first letter of the name
  const initial = category.name.trim().charAt(0).toUpperCase();
  return initial || '•';
}

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
        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityLabel={category.name}
            accessibilityState={{ selected }}
            onPress={() => onSelect(category)}
            style={({ pressed }) => [
              styles.item,
              { width: itemWidth },
              { borderColor: selected ? category.color : colors.border },
              selected ? { backgroundColor: `${category.color}18` } : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${category.color}22` }]}>
              <Text style={[styles.icon, { color: category.color }]}>
                {categoryGlyph(category)}
              </Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {category.name}
            </Text>
          </Pressable>
        );
      })}
      {onAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.addCategory')}
          onPress={onAdd}
          style={({ pressed }) => [
            styles.item,
            styles.addItem,
            { width: itemWidth },
            pressed ? styles.pressed : null,
          ]}
        >
          <View style={[styles.iconWrap, styles.addIconWrap]}>
            <Text style={styles.addIcon}>+</Text>
          </View>
          <Text style={styles.addLabel} numberOfLines={1}>
            {t('settings.addCategory')}
          </Text>
        </Pressable>
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
    borderRadius: radii.md,
    borderWidth: 1.5,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
  },
  name: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  addItem: {
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  addIconWrap: {
    backgroundColor: colors.primaryMuted,
  },
  addIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  addLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
}));
