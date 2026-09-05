import React from 'react';

export default function Skeleton({ width = '100%', height = 16, radius, style = {} }) {
  return (
    <div
      className="df-skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}
