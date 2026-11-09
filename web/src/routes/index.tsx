import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";

import { OrderCard } from "../components/orderCard.tsx";
import { OrderSigil } from "../components/orderSigil.tsx";
import { SectionHeading } from "../components/sectionHeading.tsx";
import { SquireCard } from "../components/squireCard.tsx";
import { SwearOathForm } from "../components/swearOathForm.tsx";
import { orders } from "../orders.ts";
import { trpc } from "../trpc.ts";

const immortalWords: readonly string[] = ["Life before death.", "Strength before weakness.", "Journey before destination."];

const Hero = (): JSX.Element => (
  <header className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
    <div className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[min(90vw,720px)] -translate-x-1/2 -translate-y-1/2 opacity-60">
      <div className="spin-slow h-full w-full text-sky-300/40">
        <OrderSigil />
      </div>
    </div>
    <div className="spin-rev pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[min(120vw,1000px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-sky-200/10" />
    <p className="rise-in relative font-display text-sm tracking-[0.5em] text-sky-200/70 uppercase sm:text-base">The Oathpact is renewed</p>
    <h1
      className="rise-in stormlight relative mt-6 font-title text-5xl leading-tight font-bold sm:text-7xl lg:text-8xl"
      style={{ animationDelay: "0.2s" }}
    >
      Welcome to the
      <br />
      Knights Radiant
    </h1>
    <p className="rise-in relative mt-8 max-w-2xl text-xl text-slate-300 italic sm:text-2xl" style={{ animationDelay: "0.5s" }}>
      The Everstorm has come. The Desolation returns. Ten Orders stand once more against the dark — and a place among them awaits those who would
      speak the Words.
    </p>
    <div className="rise-in relative mt-12 flex flex-col gap-4 sm:flex-row" style={{ animationDelay: "0.8s" }}>
      <a
        href="#squires"
        className="rounded-full bg-sky-300 px-8 py-3 font-display tracking-widest text-slate-950 uppercase shadow-[0_0_30px_rgba(125,211,252,0.6)] transition hover:scale-105 hover:bg-white hover:shadow-[0_0_60px_rgba(224,242,254,0.9)]"
      >
        Speak the Words
      </a>
      <a
        href="#orders"
        className="rounded-full border border-sky-200/40 px-8 py-3 font-display tracking-widest text-sky-100 uppercase backdrop-blur transition hover:border-sky-200 hover:bg-sky-200/10"
      >
        The Ten Orders
      </a>
    </div>
    <a href="#ideal" className="absolute bottom-10 animate-bounce text-sky-200/60" aria-label="Scroll down">
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </a>
  </header>
);

const ImmortalWords = (): JSX.Element => (
  <section id="ideal" className="relative px-4 py-32">
    <div className="mx-auto max-w-3xl text-center">
      <SectionHeading eyebrow="The First Ideal" title="The Immortal Words" />
      <ol className="mt-14 space-y-8">
        {immortalWords.map((line, i) => (
          <li key={line} className="rise-in font-display text-3xl text-sky-50 sm:text-5xl" style={{ animationDelay: `${String(0.3 * i)}s` }}>
            <span className="drop-shadow-[0_0_18px_rgba(125,211,252,0.7)]">{line}</span>
          </li>
        ))}
      </ol>
      <p className="mt-14 text-xl text-slate-400 italic">
        Every Radiant begins here. What comes after depends on the Order — and on the spren who chooses you.
      </p>
    </div>
  </section>
);

const TenOrders = (): JSX.Element => (
  <section id="orders" className="relative px-4 py-24">
    <div className="mx-auto max-w-6xl">
      <SectionHeading eyebrow="Ten Orders · Ten Surges" title="Choose Your Path" />
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {orders.map((order) => (
          <OrderCard key={order.name} order={order} />
        ))}
      </div>
    </div>
  </section>
);

const Squires = (): JSX.Element => {
  const { data: users } = useSuspenseQuery(trpc.listUsers.queryOptions());

  return (
    <section id="squires" className="relative px-4 py-24">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="Sworn in Urithiru" title="Our Newest Squires" />
        <SwearOathForm />
        {users.length === 0 ? (
          <p className="mt-12 text-center text-slate-400 italic">The tower awaits its first squire.</p>
        ) : (
          <ul className="mt-12 grid gap-4 sm:grid-cols-2">
            {users.map((user, i) => (
              <SquireCard key={`${user.name}-${String(i)}`} user={user} index={i} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

const Home = (): JSX.Element => (
  <main>
    <Hero />
    <ImmortalWords />
    <TenOrders />
    <Squires />
  </main>
);

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.query({ ...trpc.listUsers.queryOptions(), staleTime: "static" });
  },
  component: Home,
});
