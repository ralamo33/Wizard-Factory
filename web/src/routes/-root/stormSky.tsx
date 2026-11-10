import type { JSX } from "react";

const spherePlacements = Array.from({ length: 28 }, (_, i) => ({
  left: `${String((i * 37) % 100)}%`,
  size: `${String(4 + ((i * 7) % 9))}px`,
  animationDelay: `-${String((i * 1.7) % 18)}s`,
  animationDuration: `${String(14 + ((i * 5) % 12))}s`,
}));

export const StormSky = (): JSX.Element => (
  <div className="pointer-events-none fixed inset-0 -z-10">
    <div className="absolute inset-0 bg-background bg-radial-[ellipse_at_top] from-primary/30 to-background to-75%" />
    <div className="absolute inset-0 bg-radial-[ellipse_at_bottom_left] from-primary/15 to-transparent to-55%" />
    <div className="lightning absolute inset-0 bg-radial-[ellipse_at_70%_10%] from-foreground/90 to-transparent to-50% motion-safe:animate-lightning" />
    <div className="absolute inset-0 overflow-hidden text-primary">
      {spherePlacements.map((sphere) => (
        <span
          key={sphere.left + sphere.animationDelay}
          className="sphere motion-safe:animate-sphere-rise"
          style={{
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
