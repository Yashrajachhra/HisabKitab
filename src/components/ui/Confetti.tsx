import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { brand, categoryColors } from '../../config/theme';

const PALETTE = [
  brand.teal,
  brand.amber,
  categoryColors.food,
  categoryColors.transport,
  categoryColors.printing,
  categoryColors.groceries,
  '#EC4899',
];

const MAX_DURATION = 3200;

type Piece = {
  x: number;
  drift: number;
  spin: number;
  delay: number;
  duration: number;
  width: number;
  height: number;
  color: string;
  round: boolean;
};

function ConfettiPiece({ piece, fall }: { piece: Piece; fall: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      piece.delay,
      withTiming(1, { duration: piece.duration, easing: Easing.in(Easing.quad) }),
    );
  }, [piece, t]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value > 0.85 ? (1 - t.value) / 0.15 : 1,
    transform: [
      { translateX: piece.x + Math.sin(t.value * Math.PI * 3) * piece.drift },
      { translateY: -30 + t.value * fall },
      { rotate: `${t.value * piece.spin}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: piece.width,
          height: piece.height,
          backgroundColor: piece.color,
          borderRadius: piece.round ? piece.width / 2 : 2,
        },
        style,
      ]}
    />
  );
}

type ConfettiProps = {
  /** Start a burst when this flips to true. */
  run: boolean;
  count?: number;
  onDone?: () => void;
};

/** Lightweight confetti burst (Reanimated only, no extra dependency). */
export function Confetti({ run, count = 48, onDone }: ConfettiProps) {
  const { width, height } = useWindowDimensions();

  const pieces = useMemo<Piece[]>(() => {
    if (!run) return [];
    return Array.from({ length: count }, (_, i) => {
      const size = 6 + Math.random() * 6;
      return {
        x: Math.random() * width,
        drift: 12 + Math.random() * 28,
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
        delay: Math.random() * 400,
        duration: 2200 + Math.random() * 600,
        width: size,
        height: i % 3 === 0 ? size : size * 1.8,
        color: PALETTE[i % PALETTE.length],
        round: i % 4 === 0,
      };
    });
  }, [run, count, width]);

  useEffect(() => {
    if (!run) return;
    const timer = setTimeout(() => onDone?.(), MAX_DURATION);
    return () => clearTimeout(timer);
  }, [run, onDone]);

  if (!run) return null;

  return (
    <View style={styles.layer} pointerEvents="none" accessibilityElementsHidden>
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} fall={height + 60} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    elevation: 50,
  },
  piece: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
