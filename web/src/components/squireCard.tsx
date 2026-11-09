import type { User } from "@wizard/domain";
import type { JSX } from "react";

import { orderAt, stormlightColor } from "../orders.ts";

type SquireCardProps = Readonly<{ user: User; index: number }>;

export const SquireCard = ({ user, index }: SquireCardProps): JSX.Element => {
  const order = orderAt(index);

  return (
    <li
      className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-md transition hover:border-current hover:bg-white/[0.07]"
      style={{ color: order?.color ?? stormlightColor }}
    >
      <span className="gem flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-current/20 font-display text-lg text-white ring-1 ring-current">
        {user.name.slice(0, 1)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-lg text-white">{user.name}</p>
        <p className="text-xs tracking-widest text-white/50 uppercase">
          {user.age} years · Squire of the {order?.name ?? "Radiants"}
        </p>
      </div>
    </li>
  );
};
