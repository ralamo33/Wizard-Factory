import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { JSX } from "react";

import { useTheme } from "../contextsGlobal/themeContext.tsx";
import { SegmentedControl } from "../genericComponents/segmentedControl.tsx";
import { SiteFooter } from "./-root/siteFooter.tsx";
import { SiteHeader } from "./-root/siteHeader.tsx";
import { StormSky } from "./-root/stormSky.tsx";

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

type RouterContext = Readonly<{ queryClient: QueryClient; auth: Readonly<{ isSignedIn: () => boolean }> }>;

const RootLayout = (): JSX.Element => {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <StormSky />
      <SiteHeader>
        <SegmentedControl name="theme" label="Theme" options={themeOptions} value={theme} onChange={setTheme} />
      </SiteHeader>
      <Outlet />
      <SiteFooter />
    </>
  );
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});
