import type { JSX } from "react";

const pillClass =
  "rounded-full bg-primary px-8 py-3 font-display tracking-widest text-primary-foreground uppercase shadow-lg shadow-primary/40 transition hover:bg-primary/90 motion-safe:hover:scale-105";

type PillLinkProps = Readonly<{ href: string; label: string }>;

export const PillLink = ({ href, label }: PillLinkProps): JSX.Element => (
  <a href={href} className={`${pillClass} hover:shadow-xl hover:shadow-primary/60`}>
    {label}
  </a>
);

type PillSubmitButtonProps = Readonly<{ label: string }>;

export const PillSubmitButton = ({ label }: PillSubmitButtonProps): JSX.Element => (
  <button type="submit" className={`${pillClass} shrink-0 border-y border-transparent`}>
    {label}
  </button>
);
