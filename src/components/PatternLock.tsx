import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { C } from '../theme';

const MIN_POINTS = 4;

/**
 * 3x3 pattern input. Fires onComplete with the ordered list of selected cell
 * indexes (0..8) when the user releases with at least 4 cells selected.
 */
export function PatternLock({
  size,
  onComplete,
  error,
  disabled,
}: {
  size: number;
  onComplete: (cells: number[]) => void;
  error?: boolean;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null);
  const selectedRef = useRef<number[]>([]);
  const disabledRef = useRef(!!disabled);
  disabledRef.current = !!disabled;

  const cell = size / 3;
  const centers = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        x: (i % 3) * cell + cell / 2,
        y: Math.floor(i / 3) * cell + cell / 2,
      })),
    [cell]
  );

  const hit = (x: number, y: number): number | null => {
    const r = cell * 0.38;
    for (let i = 0; i < 9; i++) {
      if (Math.abs(x - centers[i].x) < r && Math.abs(y - centers[i].y) < r) return i;
    }
    return null;
  };
  const hitRef = useRef(hit);
  hitRef.current = hit;
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabledRef.current,
        onMoveShouldSetPanResponder: () => !disabledRef.current,
        onPanResponderGrant: e => {
          if (disabledRef.current) return;
          selectedRef.current = [];
          setSelected([]);
          const x = e.nativeEvent.locationX;
          const y = e.nativeEvent.locationY;
          if (typeof x !== 'number' || typeof y !== 'number') return;
          setCurrent({ x, y });
          const h = hitRef.current(x, y);
          if (h != null) {
            selectedRef.current = [h];
            setSelected([h]);
          }
        },
        onPanResponderMove: e => {
          if (disabledRef.current) return;
          const x = e.nativeEvent.locationX;
          const y = e.nativeEvent.locationY;
          if (typeof x !== 'number' || typeof y !== 'number') return;
          setCurrent({ x, y });
          const h = hitRef.current(x, y);
          if (h != null && !selectedRef.current.includes(h)) {
            const next = [...selectedRef.current, h];
            selectedRef.current = next;
            setSelected(next);
          }
        },
        onPanResponderRelease: () => {
          if (disabledRef.current) return;
          setCurrent(null);
          const cells = selectedRef.current;
          if (cells.length >= MIN_POINTS) {
            completeRef.current(cells);
          } else {
            selectedRef.current = [];
            setSelected([]);
          }
        },
        onPanResponderTerminate: () => setCurrent(null),
      }),
    []
  );

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => {
      selectedRef.current = [];
      setSelected([]);
    }, 500);
    return () => clearTimeout(t);
  }, [error]);

  const points = current
    ? [...selected.map(i => centers[i]), current]
    : selected.map(i => centers[i]);

  return (
    <View {...pan.panHandlers} style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {points.length > 1 ? (
          <Polyline
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={error ? C.danger : C.accent}
            strokeWidth={size * 0.035}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {centers.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={cell * (selected.includes(i) ? 0.16 : 0.11)}
            fill={selected.includes(i) ? (error ? C.danger : C.accent) : '#2A3760'}
          />
        ))}
      </Svg>
    </View>
  );
}
