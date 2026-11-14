import { Pressable, Text, View } from 'react-native';

import { radii, spacing, typography } from '../config/theme';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import type { Category } from '../db/types';
import { useResponsive } from '../hooks/useResponsive';

const GAP = spacing.sm;

type CategoryGridProps = {
  categories: Category[];
  onSelect: (category: Category) => void;
  selectedId?: string | null;
};

const ICON_GLYPH: Record<string, string> = {
  cup: 'C',
  food: 'F',
  bus: 'T',
  print: 'P',
  home: 'H',
  phone: 'M',
  pen: 'S',
  dots: '…',
};

export function CategoryGrid({ categories, onSelect, selectedId }: CategoryGridProps) {
  const { colors } = useTheme();
  const styles = useStyles();
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
                {ICON_GLYPH[category.icon] ?? '•'}
              </Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {category.name}
            </Text>
          </Pressable>
        );
      })}
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
}));
