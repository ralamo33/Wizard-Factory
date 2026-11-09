import type { JSX } from "react";
import type { Order } from "../orders.ts";

type OrderCardProps = Readonly<{ order: Order }>;

export const OrderCard = ({ order }: OrderCardProps): JSX.Element => (
  <article
    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition duration-500 hover:-translate-y-2 hover:border-current hover:shadow-[0_0_40px_-8px_currentColor]"
    style={{ color: order.color }}
  >
    <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-current opacity-10 blur-3xl transition duration-500 group-hover:opacity-40" />
    <div className="mb-4 flex items-center gap-3">
      <span className="gem inline-block h-4 w-4 rotate-45 bg-current" />
      <span className="text-xs tracking-[0.3em] text-white/50 uppercase">{order.gem}</span>
    </div>
    <h3 className="font-display text-2xl text-white">{order.name}</h3>
    <p className="mt-1 text-sm text-white/60 italic">Bonded to {order.spren}</p>
    <div className="mt-5 flex flex-wrap gap-2">
      {order.surges.map((surge) => (
        <span key={surge} className="rounded-full border border-current/40 px-3 py-1 text-xs text-white/80">
          {surge}
        </span>
      ))}
    </div>
  </article>
);
