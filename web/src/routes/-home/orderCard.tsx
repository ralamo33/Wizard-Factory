import { motion } from "motion/react";
import type { JSX } from "react";

import { spring } from "../../genericComponents/motionTokens.ts";

export type OrderCardData = Readonly<{
  name: string;
  gem: string;
  spren: string;
  surges: readonly string[];
}>;

type OrderCardProps = Readonly<{ order: OrderCardData }>;

export const OrderCard = ({ order }: OrderCardProps): JSX.Element => (
  <motion.article
    whileHover={{ y: -8 }}
    transition={spring.smooth}
    className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 text-primary backdrop-blur-md transition-[border-color,box-shadow] duration-slow hover:border-current hover:shadow-[0_0_40px_-8px_currentColor]"
  >
    <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-current opacity-10 blur-3xl transition-opacity duration-slow group-hover:opacity-40" />
    <div className="mb-4 flex items-center gap-3">
      <span className="gem inline-block h-4 w-4 rotate-45 bg-current" />
      <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">{order.gem}</span>
    </div>
    <h3 className="font-display text-2xl text-card-foreground">{order.name}</h3>
    <p className="mt-1 text-sm text-muted-foreground italic">Bonded to {order.spren}</p>
    <div className="mt-5 flex flex-wrap gap-2">
      {order.surges.map((surge) => (
        <span key={surge} className="rounded-full border border-current/40 px-3 py-1 text-xs text-card-foreground">
          {surge}
        </span>
      ))}
    </div>
  </motion.article>
);
