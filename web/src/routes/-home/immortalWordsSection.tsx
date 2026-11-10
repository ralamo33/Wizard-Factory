import { motion } from "motion/react";
import type { JSX } from "react";

import { riseIn } from "../../genericComponents/riseIn.ts";
import { SectionHeading } from "../../genericComponents/sectionHeading.tsx";

const immortalWords: readonly string[] = ["Life before death.", "Strength before weakness.", "Journey before destination."];

export const ImmortalWordsSection = (): JSX.Element => (
  <section id="ideal" className="relative px-4 py-32">
    <div className="mx-auto max-w-3xl text-center">
      <SectionHeading eyebrow="The First Ideal" title="The Immortal Words" />
      <ol className="mt-14 space-y-8">
        {immortalWords.map((line, i) => (
          <motion.li key={line} {...riseIn(i)} className="font-display text-3xl text-foreground sm:text-5xl">
            <span className="drop-shadow-lg drop-shadow-primary/70">{line}</span>
          </motion.li>
        ))}
      </ol>
      <p className="mt-14 text-xl text-muted-foreground italic">
        Every Radiant begins here. What comes after depends on the Order — and on the spren who chooses you.
      </p>
    </div>
  </section>
);
