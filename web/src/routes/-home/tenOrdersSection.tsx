import type { JSX } from "react";

import { SectionHeading } from "../../genericComponents/sectionHeading.tsx";
import { OrderCard, type OrderCardData } from "./orderCard.tsx";

type TenOrdersSectionProps = Readonly<{ orders: readonly OrderCardData[] }>;

export const TenOrdersSection = ({ orders }: TenOrdersSectionProps): JSX.Element => (
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
