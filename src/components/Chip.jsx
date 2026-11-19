import React from 'react';
import chipGreen from '../assets/chips/green.png';
import chipBlue from '../assets/chips/blue.png';
import chipPurple from '../assets/chips/purple.png';
import chipOrange from '../assets/chips/orange.png';
import chipYellow from '../assets/chips/yellow.png';

export const CHIP_IMAGES = {
  10: chipGreen,
  50: chipBlue,
  100: chipPurple,
  500: chipOrange,
  1000: chipYellow,
};

export function getChipImage(value) {
  if (CHIP_IMAGES[value]) return CHIP_IMAGES[value];
  if (value <= 25) return chipGreen;
  if (value <= 75) return chipBlue;
  if (value <= 250) return chipPurple;
  if (value <= 750) return chipOrange;
  return chipYellow;
}

// Real casino chip image with smooth rendering and drop shadow
export default function Chip({ value, size = 44, label = false, className = '', style }) {
  const imgSrc = getChipImage(value);

  return (
    <div
      className={`relative shrink-0 rounded-full select-none flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        ...style,
      }}
    >
      <img
        src={imgSrc}
        alt={`Chip ${value}`}
        draggable={false}
        className="w-full h-full object-contain pointer-events-none select-none rounded-full"
        style={{
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))',
        }}
      />
    </div>
  );
}
