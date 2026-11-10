import type { JSX } from "react";

type SegmentedOption<T extends string> = Readonly<{ value: T; label: string }>;

type SegmentedControlProps<T extends string> = Readonly<{
  name: string;
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}>;

export const SegmentedControl = <T extends string>({ name, label, options, value, onChange }: SegmentedControlProps<T>): JSX.Element => (
  <div
    role="radiogroup"
    aria-label={label}
    className="flex rounded-full border border-border bg-card/80 p-1 font-display text-xs tracking-widest uppercase backdrop-blur"
  >
    {options.map((option) => (
      <label
        key={option.value}
        className="relative rounded-full px-3 py-1 text-muted-foreground transition has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:outline-2 has-focus-visible:outline-ring"
      >
        <input
          type="radio"
          name={name}
          value={option.value}
          className="absolute inset-0 cursor-pointer appearance-none rounded-full focus:outline-none"
          checked={option.value === value}
          onChange={() => {
            onChange(option.value);
          }}
        />
        {option.label}
      </label>
    ))}
  </div>
);
