import type { JSX } from "react";

import { SectionHeading } from "../../genericComponents/sectionHeading.tsx";
import { useSquires, useSwearOath } from "./queries.ts";
import { type Accent, SquireCard } from "./squireCard.tsx";
import { SwearOathForm } from "./swearOathForm.tsx";

type SquiresSectionProps = Readonly<{ accents: readonly Accent[] }>;

export const SquiresSection = ({ accents }: SquiresSectionProps): JSX.Element => {
  const users = useSquires();
  const handleSwear = useSwearOath();

  return (
    <section id="squires" className="relative px-4 py-24">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="Sworn in Urithiru" title="Our Newest Squires" />
        <SwearOathForm onSwear={handleSwear} />
        {users.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground italic">The tower awaits its first squire.</p>
        ) : (
          <ul className="mt-12 grid gap-4 sm:grid-cols-2">
            {users.map((user, i) => (
              <SquireCard key={`${user.name}-${String(i)}`} user={user} accent={accents[i % accents.length]} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
