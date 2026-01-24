import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

interface RadarVisualizationProps {
  isScanning: boolean;
  size?: number;
}

export function RadarVisualization({ isScanning, size = 200 }: RadarVisualizationProps) {
  const { theme } = useTheme();
  
  const ring1Scale = useSharedValue(0.2);
  const ring1Opacity = useSharedValue(1);
  const ring2Scale = useSharedValue(0.2);
  const ring2Opacity = useSharedValue(1);
  const ring3Scale = useSharedValue(0.2);
  const ring3Opacity = useSharedValue(1);

  useEffect(() => {
    if (isScanning) {
      const duration = 2500;
      
      ring1Scale.value = withRepeat(
        withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      ring1Opacity.value = withRepeat(
        withTiming(0, { duration, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      
      ring2Scale.value = withDelay(
        800,
        withRepeat(
          withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
          -1,
          false
        )
      );
      ring2Opacity.value = withDelay(
        800,
        withRepeat(
          withTiming(0, { duration, easing: Easing.out(Easing.ease) }),
          -1,
          false
        )
      );
      
      ring3Scale.value = withDelay(
        1600,
        withRepeat(
          withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
          -1,
          false
        )
      );
      ring3Opacity.value = withDelay(
        1600,
        withRepeat(
          withTiming(0, { duration, easing: Easing.out(Easing.ease) }),
          -1,
          false
        )
      );
    } else {
      ring1Scale.value = 0.2;
      ring1Opacity.value = 0.3;
      ring2Scale.value = 0.4;
      ring2Opacity.value = 0.2;
      ring3Scale.value = 0.6;
      ring3Opacity.value = 0.1;
    }
  }, [isScanning, ring1Scale, ring1Opacity, ring2Scale, ring2Opacity, ring3Scale, ring3Opacity]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring3Scale.value }],
    opacity: ring3Opacity.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.ring,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderColor: theme.primary,
          },
          ring3Style,
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderColor: theme.primary,
          },
          ring2Style,
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderColor: theme.primary,
          },
          ring1Style,
        ]}
      />
      <View 
        style={[
          styles.centerDot, 
          { backgroundColor: theme.primary }
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
