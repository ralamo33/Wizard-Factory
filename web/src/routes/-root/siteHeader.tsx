import { Show, SignInButton, UserButton } from "@clerk/react";
import type { JSX } from "react";

type SiteHeaderProps = Readonly<{ children: Readonly<JSX.Element> }>;

export const SiteHeader = ({ children }: SiteHeaderProps): JSX.Element => (
  <header className="fixed top-4 right-4 z-10 flex items-center gap-4">
    <Show when="signed-out">
      <SignInButton>
        <button
          type="button"
          className="rounded-full border border-border bg-secondary/60 px-5 py-2 font-display text-sm tracking-widest text-secondary-foreground uppercase backdrop-blur transition-colors hover:bg-secondary"
        >
          Sign in
        </button>
      </SignInButton>
    </Show>
    <Show when="signed-in">
      <UserButton />
    </Show>
    {children}
  </header>
);
