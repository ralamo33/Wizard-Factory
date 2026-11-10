import { motion } from "motion/react";
import type { JSX } from "react";

import { PillLink } from "../../genericComponents/pill.tsx";
import { riseIn } from "../../genericComponents/riseIn.ts";
import { OrderSigil, type SigilPoint } from "./orderSigil.tsx";

type HeroSectionProps = Readonly<{ sigilPoints: readonly SigilPoint[] }>;

export const HeroSection = ({ sigilPoints }: HeroSectionProps): JSX.Element => (
  <header className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
    <div className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[min(90vw,720px)] -translate-x-1/2 -translate-y-1/2 opacity-60">
      <div className="h-full w-full text-primary/40 motion-safe:animate-spin-slow">
        <OrderSigil points={sigilPoints} />
      </div>
    </div>
    <div className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[min(120vw,1000px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-border/50 motion-safe:animate-spin-reverse" />
    <motion.p {...riseIn(0)} className="relative font-display text-sm tracking-[0.5em] text-primary uppercase sm:text-base">
      The Oathpact is renewed
    </motion.p>
    <motion.h1
      {...riseIn(1)}
      className="stormlight relative mt-6 font-title text-5xl leading-tight font-bold motion-safe:animate-shimmer sm:text-7xl lg:text-8xl"
    >
      Welcome to the
      <br />
      Knights Radiant
    </motion.h1>
    <motion.p {...riseIn(2)} className="relative mt-8 max-w-2xl text-xl text-muted-foreground italic sm:text-2xl">
      The Everstorm has come. The Desolation returns. Ten Orders stand once more against the dark — and a place among them awaits those who would
      speak the Words.
    </motion.p>
    <motion.div {...riseIn(3)} className="relative mt-12 flex flex-col gap-4 sm:flex-row">
      <PillLink href="#squires" label="Speak the Words" />
      <a
        href="#orders"
        className="rounded-full border border-border bg-secondary/60 px-8 py-3 font-display tracking-widest text-secondary-foreground uppercase backdrop-blur transition hover:bg-secondary"
      >
        The Ten Orders
      </a>
    </motion.div>
    <a href="#ideal" className="absolute bottom-10 text-muted-foreground motion-safe:animate-bounce" aria-label="Scroll down">
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </a>
  </header>
);
