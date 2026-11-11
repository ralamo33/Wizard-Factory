import { ClerkLoaded, ClerkProvider, useClerk } from "@clerk/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { MotionConfig } from "motion/react";
import { type JSX, StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";

import { queryClient } from "./api/trpc.ts";
import { ThemeProvider } from "./contextsGlobal/themeContext.tsx";
import { routeTree } from "./routeTree.gen.ts";

const publishableKey: unknown = import.meta.env["VITE_CLERK_PUBLISHABLE_KEY"];

const signedOut = { isSignedIn: (): boolean => false };

const router = createRouter({ routeTree, context: { queryClient, auth: signedOut } });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const clerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorPrimaryForeground: "var(--primary-foreground)",
    colorDanger: "var(--danger)",
    colorSuccess: "var(--success)",
    colorWarning: "var(--warning)",
    colorNeutral: "var(--foreground)",
    colorForeground: "var(--card-foreground)",
    colorMuted: "var(--muted)",
    colorMutedForeground: "var(--muted-foreground)",
    colorBackground: "var(--card)",
    colorInput: "var(--background)",
    colorInputForeground: "var(--foreground)",
    colorBorder: "var(--border)",
    colorRing: "var(--ring)",
    colorModalBackdrop: "var(--background)",
  },
} as const;

const AuthenticatedRouter = (): JSX.Element => {
  const clerk = useClerk();
  const auth = useMemo(() => ({ isSignedIn: (): boolean => clerk.isSignedIn }), [clerk]);

  return <RouterProvider router={router} context={{ auth }} />;
};

const rootElement = document.querySelector("#root");

if (rootElement !== null) {
  createRoot(rootElement).render(
    <StrictMode>
      <ClerkProvider
        publishableKey={typeof publishableKey === "string" ? publishableKey : ""}
        appearance={clerkAppearance}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        routerPush={async (to) => router.navigate({ href: to })}
        routerReplace={async (to) => router.navigate({ href: to, replace: true })}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <MotionConfig reducedMotion="user">
              <ClerkLoaded>
                <AuthenticatedRouter />
              </ClerkLoaded>
            </MotionConfig>
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </StrictMode>,
  );
}
