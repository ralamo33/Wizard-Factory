import { SignIn } from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";

const SignInPage = (): JSX.Element => (
  <main className="flex min-h-screen items-center justify-center px-4 py-24">
    <SignIn routing="path" path="/sign-in" />
  </main>
);

export const Route = createFileRoute("/sign-in/$")({
  component: SignInPage,
});
