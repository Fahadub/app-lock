import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

export function GlobeIcon({ size = 20, color = '#8C99B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={color} strokeWidth={1.8}>
        <Circle cx={12} cy={12} r={8.5} />
        <Ellipse cx={12} cy={12} rx={3.8} ry={8.5} />
        <Line x1={3.5} y1={12} x2={20.5} y2={12} />
      </G>
    </Svg>
  );
}

export function SearchIcon({ size = 18, color = '#8C99B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={color} strokeWidth={2} strokeLinecap="round">
        <Circle cx={10.5} cy={10.5} r={6.5} />
        <Line x1={15.5} y1={15.5} x2={20.5} y2={20.5} />
      </G>
    </Svg>
  );
}

export function PhoneIcon({ size = 26, color = '#8C99B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={color} strokeWidth={1.8} strokeLinejoin="round">
        <Rect x={7} y={3} width={10} height={18} rx={2.5} />
        <Line x1={10.5} y1={18} x2={13.5} y2={18} strokeLinecap="round" />
      </G>
    </Svg>
  );
}

export function KeypadIcon({ size = 34, color = '#EAF0FF' }: IconProps) {
  const keys = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      {keys.map(i => (
        <Rect
          key={i}
          x={3.5 + (i % 3) * 7}
          y={3.5 + Math.floor(i / 3) * 7}
          width={3.4}
          height={3.4}
          rx={1}
        />
      ))}
    </Svg>
  );
}

export function PatternIcon({ size = 34, color = '#EAF0FF' }: IconProps) {
  const pts = [
    { x: 5, y: 5 }, { x: 12, y: 5 }, { x: 19, y: 5 },
    { x: 5, y: 12 }, { x: 12, y: 12 }, { x: 19, y: 12 },
    { x: 5, y: 19 }, { x: 12, y: 19 }, { x: 19, y: 19 },
  ];
  const d = `M ${pts[6].x} ${pts[6].y} L ${pts[4].x} ${pts[4].y} L ${pts[2].x} ${pts[2].y}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={i === 6 || i === 4 || i === 2 ? 2.1 : 1.6} fill={color} />
      ))}
    </Svg>
  );
}
