import type { JSX } from "react";

import { orders, stormlightColor } from "../orders.ts";

const pointOnCircle = (index: number, count: number, radius: number): Readonly<{ x: number; y: number }> => {
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;

  return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
};

const polygonPoints = (count: number, radius: number): string =>
  Array.from({ length: count }, (_, i) => {
    const { x, y } = pointOnCircle(i, count, radius);

    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

export const OrderSigil = (): JSX.Element => (
  <svg viewBox="0 0 100 100" className="h-full w-full">
    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 3" />
    <polygon points={polygonPoints(10, 40)} fill="none" stroke="currentColor" strokeWidth="0.8" />
    <polygon points={polygonPoints(5, 30)} fill="none" stroke="currentColor" strokeWidth="0.5" />
    {orders.map((order, i) => {
      const { x, y } = pointOnCircle(i, orders.length, 40);

      return <circle key={order.name} cx={x} cy={y} r="3.2" fill="currentColor" className="gem" style={{ color: order.color }} />;
    })}
    <circle cx="50" cy="50" r="8" fill="#e0f2fe" className="gem" style={{ color: stormlightColor }} />
  </svg>
);
