import React, { useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

export type AnimatedPressableProps = PressableProps & {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  opacityTo?: number;
};

export function AnimatedPressable({
  children,
  style,
  scaleTo = 0.97,
  opacityTo = 0.9,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: AnimatedPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: GestureResponderEvent) => {
    if (!disabled) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: scaleTo,
          useNativeDriver: true,
          speed: 60,
          bounciness: 3,
        }),
        Animated.timing(opacityAnim, {
          toValue: opacityTo,
          duration: 90,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    if (!disabled) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 45,
          bounciness: 5,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onPressOut?.(e);
  };

  const flatStyle = (StyleSheet.flatten(style) as ViewStyle) || {};
  const pressableStyle: ViewStyle = {};
  if (flatStyle.flex !== undefined) pressableStyle.flex = flatStyle.flex;
  if (flatStyle.flexGrow !== undefined) pressableStyle.flexGrow = flatStyle.flexGrow;
  if (flatStyle.width !== undefined) pressableStyle.width = flatStyle.width;
  if (flatStyle.minWidth !== undefined) pressableStyle.minWidth = flatStyle.minWidth;
  if (flatStyle.alignSelf !== undefined) pressableStyle.alignSelf = flatStyle.alignSelf;

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={Object.keys(pressableStyle).length > 0 ? pressableStyle : undefined}
      {...rest}>
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
