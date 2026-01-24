import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface SignalBarsProps {
  strength: number;
  size?: 'small' | 'medium';
}

export function SignalBars({ strength, size = 'medium' }: SignalBarsProps) {
  const { theme } = useTheme();
  const barCount = 4;
  const activeCount = Math.ceil(strength * barCount);
  
  const barHeight = size === 'small' ? [4, 7, 10, 13] : [6, 10, 14, 18];
  const barWidth = size === 'small' ? 3 : 4;
  const gap = size === 'small' ? 2 : 3;

  return (
    <View style={[styles.container, { gap }]}>
      {Array.from({ length: barCount }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            {
              width: barWidth,
              height: barHeight[index],
              backgroundColor: index < activeCount ? theme.primary : theme.backgroundSecondary,
              borderRadius: barWidth / 2,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bar: {},
});
