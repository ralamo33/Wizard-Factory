import type { JSX } from "react";
import { orderAt, stormlightColor } from "../orders.ts";

const spheres = Array.from({ length: 28 }, (_, i) => ({
  color: orderAt(i)?.color ?? stormlightColor,
  left: `${String((i * 37) % 100)}%`,
  size: `${String(4 + ((i * 7) % 9))}px`,
  animationDelay: `-${String((i * 1.7) % 18)}s`,
  animationDuration: `${String(14 + ((i * 5) % 12))}s`,
}));

export const StormSky = (): JSX.Element => (
  <div className="pointer-events-none fixed inset-0 -z-10">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e3a8a_0%,_#0b1430_40%,_#03060f_75%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(56,189,248,0.15),_transparent_55%)]" />
    <div className="lightning absolute inset-0 bg-[radial-gradient(ellipse_at_70%_10%,_rgba(224,242,254,0.9),_transparent_50%)]" />
    <div className="absolute inset-0 overflow-hidden">
      {spheres.map((sphere) => (
        <span
          key={sphere.left + sphere.animationDelay}
          className="sphere"
          style={{
            color: sphere.color,
            left: sphere.left,
            width: sphere.size,
            height: sphere.size,
            animationDelay: sphere.animationDelay,
            animationDuration: sphere.animationDuration,
          }}
        />
      ))}
    </div>
  </div>
);
