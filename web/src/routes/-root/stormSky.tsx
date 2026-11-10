import type { JSX } from "react";

export const StormSky = (): JSX.Element => (
  <div className="pointer-events-none fixed inset-0 -z-10">
    <div className="absolute inset-0 bg-background bg-radial-[ellipse_at_top] from-primary/30 to-background to-75%" />
    <div className="absolute inset-0 bg-radial-[ellipse_at_bottom_left] from-primary/15 to-transparent to-55%" />
  </div>
);
