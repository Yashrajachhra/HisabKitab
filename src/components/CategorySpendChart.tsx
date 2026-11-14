import { Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';

import { spacing, typography } from '../config/theme';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import type { CategorySpend } from '../db/repositories/expensesRepo';
import { useResponsive } from '../hooks/useResponsive';
import { toMajorUnits } from '../utils/money';

const Y_AXIS_WIDTH = 36;

type CategorySpendChartProps = {
  data: CategorySpend[];
};

export function CategorySpendChart({ data }: CategorySpendChartProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const { contentWidth } = useResponsive();
  const chartWidth = contentWidth - spacing.md * 2 - Y_AXIS_WIDTH - spacing.sm;
  const stackPie = contentWidth < 320;
  const pieRadius = Math.max(56, Math.min(84, Math.round(contentWidth * 0.2)));

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('dashboard.chartEmpty')}</Text>
      </View>
    );
  }

  const pieData = data.slice(0, 6).map((item) => ({
    value: toMajorUnits(item.amountMinor),
    color: item.categoryColor,
    text: item.categoryName.slice(0, 8),
  }));

  const barData = data.slice(0, 6).map((item) => ({
    value: toMajorUnits(item.amountMinor),
    label: item.categoryName.slice(0, 6),
    frontColor: item.categoryColor,
  }));
  const slot = chartWidth / Math.max(barData.length, 1);
  const barWidth = Math.max(14, Math.min(32, Math.round(slot * 0.6)));

  return (
    <View>
      <Text style={styles.subtitle}>{t('dashboard.byCategory')}</Text>
      <View
        style={[styles.pieWrap, stackPie ? styles.pieStacked : null]}
        accessibilityLabel={t('dashboard.pieA11y')}
      >
        <PieChart
          data={pieData}
          donut
          radius={pieRadius}
          innerRadius={Math.round(pieRadius * 0.56)}
          innerCircleColor={colors.surface}
          showText={false}
          focusOnPress
        />
        <View style={[styles.legend, stackPie ? styles.legendStacked : null]}>
          {data.slice(0, 6).map((item) => (
            <View key={item.categoryId} style={styles.legendRow}>
              <View style={[styles.swatch, { backgroundColor: item.categoryColor }]} />
              <Text style={styles.legendText} numberOfLines={1}>
                {item.categoryName}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={[styles.subtitle, styles.spaced]}>{t('dashboard.barTitle')}</Text>
      <BarChart
        data={barData}
        width={chartWidth}
        height={160}
        barWidth={barWidth}
        adjustToWidth
        parentWidth={chartWidth}
        initialSpacing={spacing.sm}
        endSpacing={0}
        yAxisLabelWidth={Y_AXIS_WIDTH}
        roundedTop
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={styles.axis}
        xAxisLabelTextStyle={styles.axis}
        noOfSections={4}
        isAnimated
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  empty: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.md,
  },
  spaced: {
    marginTop: spacing.lg,
  },
  pieWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pieStacked: {
    flexDirection: 'column',
  },
  legend: {
    flex: 1,
    gap: spacing.sm,
  },
  legendStacked: {
    flex: 0,
    alignSelf: 'stretch',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  axis: {
    color: colors.textSecondary,
    fontSize: 10,
  },
}));
