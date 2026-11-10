import type { User } from "@wizard/domain";
import type { JSX } from "react";

export type Accent = Readonly<{ name: string }>;

type SquireCardProps = Readonly<{ user: User; accent: Accent | undefined }>;

export const SquireCard = ({ user, accent }: SquireCardProps): JSX.Element => (
  <li className="flex items-center gap-4 rounded-xl border border-border bg-card/60 px-5 py-4 text-primary backdrop-blur-md transition hover:border-current hover:bg-card">
    <span className="gem flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-current/20 font-display text-lg text-card-foreground ring-1 ring-current motion-safe:animate-gem-pulse">
      {user.name.slice(0, 1)}
    </span>
    <div className="min-w-0">
      <p className="truncate font-display text-lg text-card-foreground">{user.name}</p>
      <p className="text-xs tracking-widest text-muted-foreground uppercase">
        {user.age} years · Squire of the {accent?.name ?? "Radiants"}
      </p>
    </div>
  </li>
);
