import type { JSX } from "react";

type SectionHeadingProps = Readonly<{ eyebrow: string; title: string }>;

export const SectionHeading = ({ eyebrow, title }: SectionHeadingProps): JSX.Element => (
  <div className="text-center">
    <p className="font-display text-sm tracking-[0.5em] text-primary uppercase">{eyebrow}</p>
    <h2 className="mt-4 font-title text-3xl text-foreground sm:text-4xl">{title}</h2>
    <div className="mx-auto mt-6 h-px w-40 bg-gradient-to-r from-transparent via-accent to-transparent" />
  </div>
);
