import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { JSX } from "react";

import { StormSky } from "../components/stormSky.tsx";

const RootLayout = (): JSX.Element => (
  <>
    <StormSky />
    <Outlet />
    <footer className="border-t border-white/5 px-4 py-12 text-center">
      <p className="font-display text-xs tracking-[0.4em] text-slate-500 uppercase">Journey before destination, Radiant</p>
    </footer>
  </>
);

export const Route = createRootRouteWithContext<Readonly<{ queryClient: QueryClient }>>()({
  component: RootLayout,
});
