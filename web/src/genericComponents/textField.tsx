import type { JSX } from "react";

const inputClass =
  "w-full rounded-full border border-input bg-card/60 px-5 py-3 text-card-foreground placeholder:text-muted-foreground backdrop-blur focus:border-ring focus:outline-none";

type TextFieldProps = Readonly<{
  id: string;
  name: string;
  label: string;
  placeholder: string;
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
  inputMode?: "numeric";
  className?: string;
}>;

export const TextField = ({ id, name, label, placeholder, value, error, onChange, inputMode, className = "" }: TextFieldProps): JSX.Element => {
  const errorId = `${id}-error`;

  return (
    <div className={`w-full ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        name={name}
        className={inputClass}
        placeholder={placeholder}
        inputMode={inputMode}
        value={value}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? undefined : errorId}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      {error === undefined ? undefined : (
        <p id={errorId} className="mt-2 px-5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
};
