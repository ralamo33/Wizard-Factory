import { Show } from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";

import { prefetchSquires, SquiresSection } from "../domainViews/identity/index.ts";
import { HeroSection } from "./-home/heroSection.tsx";
import { ImmortalWordsSection } from "./-home/immortalWordsSection.tsx";
import { TenOrdersSection } from "./-home/tenOrdersSection.tsx";
import { orders } from "./-root/orders.ts";

const Home = (): JSX.Element => (
  <main>
    <HeroSection sigilPoints={orders} />
    <ImmortalWordsSection />
    <TenOrdersSection orders={orders} />
    <Show when="signed-in">
      <SquiresSection accents={orders} />
    </Show>
  </main>
);

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    if (context.auth.isSignedIn()) {
      await prefetchSquires(context.queryClient);
    }
  },
  component: Home,
});
