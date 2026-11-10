import type { JSX } from "react";

const selectClass =
  "w-full rounded-full border border-input bg-card/60 px-5 py-3 text-card-foreground backdrop-blur focus:border-ring focus:outline-none";

type SelectOption = Readonly<{ value: string; label: string }>;

type SelectFieldProps = Readonly<{
  id: string;
  name: string;
  label: string;
  emptyLabel: string;
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
}>;

export const SelectField = ({ id, name, label, emptyLabel, options, value, onChange }: SelectFieldProps): JSX.Element => (
  <div className="w-full">
    <label htmlFor={id} className="sr-only">
      {label}
    </label>
    <select
      id={id}
      name={name}
      className={selectClass}
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    >
      <option value="">{emptyLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);
