import type { MotionProps } from "motion/react";

import { spring, staggerStep } from "./motionTokens.ts";

export const riseIn = (step: number): Pick<MotionProps, "initial" | "animate" | "transition"> => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { ...spring.smooth, delay: step * staggerStep },
});
