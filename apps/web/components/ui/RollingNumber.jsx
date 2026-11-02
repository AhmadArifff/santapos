'use client';

import { useEffect, useState } from 'react';

/**
 * RollingNumber Component
 * Provides a buttery-smooth rolling number ticker animation (odometer effect)
 * with ease-out cubic deceleration and Indonesian currency formatting.
 */
export default function RollingNumber({
  value = 0,
  prefix = '',
  suffix = '',
  format = true,
  duration = 800,
  className = '',
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startVal = displayValue;
    const endVal = Number(value) || 0;

    if (startVal === endVal) return;

    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic: starts briskly and glides to a silky stop
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const formatted = format
    ? Number(displayValue).toLocaleString('id-ID')
    : displayValue;

  return (
    <span className={`inline-block tabular-nums font-mono transition-colors ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

