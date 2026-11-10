import type { MotionProps } from "motion/react";

import { spring, staggerStep } from "./motionTokens.ts";

type RiseInProps = Pick<MotionProps, "initial" | "animate" | "whileInView" | "viewport" | "transition">;

const shown = { opacity: 1, y: 0 };

export const riseIn = (step: number, trigger: "load" | "inView"): RiseInProps => ({
  initial: { opacity: 0, y: 24 },
  ...(trigger === "load" ? { animate: shown } : { whileInView: shown, viewport: { once: true } }),
  transition: { ...spring.smooth, delay: step * staggerStep },
});
