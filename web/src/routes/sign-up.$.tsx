import { SignUp } from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";

const SignUpPage = (): JSX.Element => (
  <main className="flex min-h-screen items-center justify-center px-4 py-24">
    <SignUp routing="path" path="/sign-up" />
  </main>
);

export const Route = createFileRoute("/sign-up/$")({
  component: SignUpPage,
});
