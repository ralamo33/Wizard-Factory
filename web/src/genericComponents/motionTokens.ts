export const duration = { instant: 0.1, fast: 0.15, base: 0.25, slow: 0.4 } as const;

export const ease = {
  standard: [0.2, 0, 0, 1],
  enter: [0.05, 0.7, 0.1, 1],
  exit: [0.3, 0, 0.8, 0.15],
} as const;

export const spring = {
  snappy: { type: "spring", visualDuration: 0.2, bounce: 0 },
  smooth: { type: "spring", visualDuration: 0.35, bounce: 0 },
  bouncy: { type: "spring", visualDuration: 0.4, bounce: 0.3 },
} as const;

export const staggerStep = 0.15;
