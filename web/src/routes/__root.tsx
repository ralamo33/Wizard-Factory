import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { JSX } from "react";

import { useTheme } from "../contextsGlobal/themeContext.tsx";
import { SegmentedControl } from "../genericComponents/segmentedControl.tsx";
import { SiteFooter } from "./-root/siteFooter.tsx";
import { StormSky } from "./-root/stormSky.tsx";

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

const RootLayout = (): JSX.Element => {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <StormSky />
      <div className="fixed top-4 right-4 z-10">
        <SegmentedControl name="theme" label="Theme" options={themeOptions} value={theme} onChange={setTheme} />
      </div>
      <Outlet />
      <SiteFooter />
    </>
  );
};

export const Route = createRootRouteWithContext<Readonly<{ queryClient: QueryClient }>>()({
  component: RootLayout,
});
