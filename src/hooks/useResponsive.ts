import { useWindowDimensions } from 'react-native';

import { spacing } from '../config/theme';

export const MAX_CONTENT_WIDTH = 560;

/** Screen-size helpers so layouts adapt from 320px phones up to tablets. */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isSmall = width < 360;
  const isTablet = width >= 600;
  const isShort = height < 700;
  const gutter = isSmall ? spacing.sm + 4 : isTablet ? spacing.lg : spacing.md;
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH) - gutter * 2;

  /** Scales a size down on small phones and slightly up on tablets. */
  const scale = (size: number) => Math.round(size * (isSmall ? 0.88 : isTablet ? 1.1 : 1));

  return { width, height, isSmall, isTablet, isShort, gutter, contentWidth, scale };
}
