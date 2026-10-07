import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { C } from '../theme';

const KEYS: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

export function Keypad({
  onDigit,
  onDelete,
  disabled,
}: {
  onDigit: (d: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', marginTop: 8 }}>
      {KEYS.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 14 }}>
          {row.map((k, j) => {
            if (k === '') {
              return <View key={j} style={{ width: 74, height: 74, marginHorizontal: 12 }} />;
            }
            return (
              <Pressable
                key={j}
                disabled={disabled}
                onPress={() => (k === 'del' ? onDelete() : onDigit(k))}
                style={({ pressed }) => ({
                  width: 74,
                  height: 74,
                  borderRadius: 37,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginHorizontal: 12,
                  backgroundColor: pressed ? C.card2 : C.card,
                  borderWidth: 1,
                  borderColor: C.border,
                  opacity: disabled ? 0.4 : 1,
                })}>
                <Text style={{ color: C.text, fontSize: 26, fontWeight: '600' }}>
                  {k === 'del' ? '⌫' : k}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function PinDots({ total, filled, error }: { total: number; filled: number; error?: boolean }) {
  const size = total > 6 ? 11 : 14;
  const count = Math.max(total, 1);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 18 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            marginHorizontal: 6,
            backgroundColor: i < filled ? (error ? C.danger : C.accent) : C.border,
          }}
        />
      ))}
    </View>
  );
}
