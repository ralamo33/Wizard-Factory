import type { JSX } from "react";

type CheckboxOption = Readonly<{ value: string; label: string }>;

type CheckboxGroupProps = Readonly<{
  name: string;
  label: string;
  options: readonly CheckboxOption[];
  value: readonly string[];
  onChange: (value: readonly string[]) => void;
}>;

export const CheckboxGroup = ({ name, label, options, value, onChange }: CheckboxGroupProps): JSX.Element => (
  <fieldset className="w-full">
    <legend className="mb-2 px-1 font-display text-xs tracking-widest text-muted-foreground uppercase">{label}</legend>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-sm text-card-foreground has-checked:border-primary has-checked:bg-primary/20 has-focus-visible:outline-2 has-focus-visible:outline-ring"
        >
          <input
            type="checkbox"
            name={name}
            value={option.value}
            className="accent-primary"
            checked={value.includes(option.value)}
            onChange={(event) => {
              const isChecked = event.target.checked;

              onChange(
                options
                  .filter((candidate) => (candidate.value === option.value ? isChecked : value.includes(candidate.value)))
                  .map(({ value: v }) => v),
              );
            }}
          />
          {option.label}
        </label>
      ))}
    </div>
  </fieldset>
);
