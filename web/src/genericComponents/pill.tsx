import { motion } from "motion/react";
import type { JSX } from "react";

import { spring } from "./motionTokens.ts";

const pillClass =
  "rounded-full bg-primary px-8 py-3 font-display tracking-widest text-primary-foreground uppercase shadow-lg shadow-primary/40 transition-[background-color,box-shadow] hover:bg-primary/90";

const pillHover = { whileHover: { scale: 1.05 }, transition: spring.snappy } as const;

type PillLinkProps = Readonly<{ href: string; label: string }>;

export const PillLink = ({ href, label }: PillLinkProps): JSX.Element => (
  <motion.a {...pillHover} href={href} className={`${pillClass} hover:shadow-xl hover:shadow-primary/60`}>
    {label}
  </motion.a>
);

type PillSubmitButtonProps = Readonly<{ label: string }>;

export const PillSubmitButton = ({ label }: PillSubmitButtonProps): JSX.Element => (
  <motion.button {...pillHover} type="submit" className={`${pillClass} shrink-0 border-y border-transparent`}>
    {label}
  </motion.button>
);
