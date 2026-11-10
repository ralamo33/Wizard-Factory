import { type JSX, useEffect, useId, useState } from "react";

import { CheckboxGroup } from "./checkboxGroup.tsx";
import { SelectField } from "./selectField.tsx";
import { TextField } from "./textField.tsx";

type FilterOption = Readonly<{ value: string; label: string }>;

type FilterField =
  | Readonly<{ kind: "contains"; label: string }>
  | Readonly<{ kind: "equals"; label: string; anyLabel: string; options: readonly FilterOption[] }>
  | Readonly<{ kind: "range"; label: string; minLabel: string; maxLabel: string }>
  | Readonly<{ kind: "dateRange"; label: string; fromLabel: string; toLabel: string }>
  | Readonly<{ kind: "oneOf"; label: string; options: readonly FilterOption[] }>;

export type FilterFields<Filters> = { readonly [K in keyof Filters]-?: FilterField };

type Bounds = Readonly<{ low: string | number | undefined; high: string | number | undefined }>;

const typingPause = 400;

const textOf = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);

const listOf = (value: unknown): readonly string[] => (Array.isArray(value) ? value.filter((item) => typeof item === "string") : []);

const propertyOf = (value: unknown, key: string): unknown =>
  typeof value === "object" && value !== null ? Object.entries(value).find(([candidate]) => candidate === key)?.[1] : undefined;

const numberAt = (value: unknown, key: "min" | "max"): number | undefined => {
  const property = propertyOf(value, key);

  return typeof property === "number" ? property : undefined;
};

const dateAt = (value: unknown, key: "from" | "to"): string | undefined => textOf(propertyOf(value, key));

const boundsOf = (kind: "range" | "dateRange", value: unknown): Bounds =>
  kind === "dateRange" ? { low: dateAt(value, "from"), high: dateAt(value, "to") } : { low: numberAt(value, "min"), high: numberAt(value, "max") };

const optionLabels = (options: readonly FilterOption[], values: readonly string[]): string =>
  options
    .filter((option) => values.includes(option.value))
    .map((option) => option.label)
    .join(" or ");

type BoundsWording = Readonly<{ atLeast: string; atMost: string }>;

const rangeWording: BoundsWording = { atLeast: "at least", atMost: "at most" };
const dateRangeWording: BoundsWording = { atLeast: "from", atMost: "until" };

const boundsDescription = (label: string, { low, high }: Bounds, wording: BoundsWording): string | undefined => {
  if (low !== undefined && high !== undefined) {
    return `${label} from ${String(low)} to ${String(high)}`;
  }

  if (low !== undefined) {
    return `${label} ${wording.atLeast} ${String(low)}`;
  }

  return high === undefined ? undefined : `${label} ${wording.atMost} ${String(high)}`;
};

const describeFilter = (field: FilterField, value: unknown): string | undefined => {
  switch (field.kind) {
    case "contains": {
      const text = textOf(value);

      return text === undefined ? undefined : `${field.label} contains ${text}`;
    }

    case "equals": {
      const text = textOf(value);

      return text === undefined ? undefined : `${field.label} is ${field.options.find((option) => option.value === text)?.label ?? text}`;
    }

    case "oneOf": {
      const values = listOf(value);

      return values.length === 0 ? undefined : `${field.label} is ${optionLabels(field.options, values)}`;
    }

    case "range": {
      return boundsDescription(field.label, boundsOf(field.kind, value), rangeWording);
    }

    case "dateRange": {
      return boundsDescription(field.label, boundsOf(field.kind, value), dateRangeWording);
    }
  }
};

const filterKeys = <Filters,>(fields: FilterFields<Filters>): readonly Extract<keyof Filters, string>[] =>
  Object.keys(fields).filter((key): key is Extract<keyof Filters, string> => key in fields);

export const hasActiveFilters = <Filters,>(fields: FilterFields<Filters>, filters: Filters): boolean =>
  filterKeys(fields).some((key) => describeFilter(fields[key], filters[key]) !== undefined);

const useDraft = (applied: string): readonly [string, (draft: string) => void] => {
  const [draft, setDraft] = useState(applied);
  const [lastApplied, setLastApplied] = useState(applied);

  if (applied !== lastApplied) {
    setLastApplied(applied);
    setDraft(applied);
  }

  return [draft, setDraft];
};

const blankToUndefined = (text: string): string | undefined => (text.trim() === "" ? undefined : text.trim());

const parseBound = (text: string): number | undefined | false => {
  const trimmed = blankToUndefined(text);

  if (trimmed === undefined) {
    return undefined;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : false;
};

type FieldProps<Value> = Readonly<{ name: string; value: Value; onChange: (value: unknown) => void }>;

const ContainsFilter = ({ name, label, value, onChange }: FieldProps<string | undefined> & Readonly<{ label: string }>): JSX.Element => {
  const id = useId();
  const [draft, setDraft] = useDraft(value ?? "");

  useEffect(() => {
    const next = blankToUndefined(draft);

    if (next === value) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onChange(next);
    }, typingPause);

    return (): void => {
      clearTimeout(timer);
    };
  }, [draft, value, onChange]);

  return <TextField id={id} name={name} label={label} placeholder={label} value={draft} error={undefined} onChange={setDraft} />;
};

type BoundsFilterProps = FieldProps<unknown> &
  Readonly<{ kind: "range" | "dateRange"; lowLabel: string; highLabel: string; lowKey: string; highKey: string }>;

const BoundsFilter = ({ name, kind, value, lowLabel, highLabel, lowKey, highKey, onChange }: BoundsFilterProps): JSX.Element => {
  const lowId = useId();
  const highId = useId();
  const bounds = boundsOf(kind, value);
  const [lowDraft, setLowDraft] = useDraft(bounds.low === undefined ? "" : String(bounds.low));
  const [highDraft, setHighDraft] = useDraft(bounds.high === undefined ? "" : String(bounds.high));

  const apply = (low: string, high: string): void => {
    const parse = kind === "range" ? parseBound : blankToUndefined;
    const parsedLow = parse(low);
    const parsedHigh = parse(high);

    if (parsedLow !== false && parsedHigh !== false) {
      onChange(parsedLow === undefined && parsedHigh === undefined ? undefined : { [lowKey]: parsedLow, [highKey]: parsedHigh });
    }
  };

  const handleLowChange = (text: string): void => {
    setLowDraft(text);
    apply(text, highDraft);
  };

  const handleHighChange = (text: string): void => {
    setHighDraft(text);
    apply(lowDraft, text);
  };

  const fieldProps = kind === "range" ? ({ inputMode: "numeric" } as const) : ({ type: "date" } as const);

  return (
    <div className="flex w-full gap-3">
      <TextField
        id={lowId}
        name={`${name}-${lowKey}`}
        label={lowLabel}
        placeholder={lowLabel}
        value={lowDraft}
        error={undefined}
        onChange={handleLowChange}
        {...fieldProps}
      />
      <TextField
        id={highId}
        name={`${name}-${highKey}`}
        label={highLabel}
        placeholder={highLabel}
        value={highDraft}
        error={undefined}
        onChange={handleHighChange}
        {...fieldProps}
      />
    </div>
  );
};

const EqualsFilter = ({
  name,
  value,
  onChange,
  label,
  anyLabel,
  options,
}: FieldProps<string | undefined> & Readonly<{ label: string; anyLabel: string; options: readonly FilterOption[] }>): JSX.Element => {
  const id = useId();

  return (
    <SelectField
      id={id}
      name={name}
      label={label}
      emptyLabel={anyLabel}
      options={options}
      value={value ?? ""}
      onChange={(next) => {
        onChange(blankToUndefined(next));
      }}
    />
  );
};

type FilterControlProps = Readonly<{ name: string; field: FilterField; value: unknown; onChange: (value: unknown) => void }>;

const FilterControl = ({ name, field, value, onChange }: FilterControlProps): JSX.Element => {
  switch (field.kind) {
    case "contains": {
      return <ContainsFilter name={name} label={field.label} value={textOf(value)} onChange={onChange} />;
    }

    case "equals": {
      return (
        <EqualsFilter name={name} label={field.label} anyLabel={field.anyLabel} options={field.options} value={textOf(value)} onChange={onChange} />
      );
    }

    case "range": {
      return (
        <BoundsFilter
          name={name}
          kind="range"
          lowLabel={field.minLabel}
          highLabel={field.maxLabel}
          lowKey="min"
          highKey="max"
          value={value}
          onChange={onChange}
        />
      );
    }

    case "dateRange": {
      return (
        <BoundsFilter
          name={name}
          kind="dateRange"
          lowLabel={field.fromLabel}
          highLabel={field.toLabel}
          lowKey="from"
          highKey="to"
          value={value}
          onChange={onChange}
        />
      );
    }

    case "oneOf": {
      return (
        <CheckboxGroup
          name={name}
          label={field.label}
          options={field.options}
          value={listOf(value)}
          onChange={(next) => {
            onChange(next.length === 0 ? undefined : next);
          }}
        />
      );
    }
  }
};

type FilterBarProps<Filters> = Readonly<{
  label: string;
  fields: FilterFields<Filters>;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}>;

export const FilterBar = <Filters,>({ label, fields, filters, onFiltersChange }: FilterBarProps<Filters>): JSX.Element => {
  const keys = filterKeys(fields);
  const pills = keys.flatMap((key) => {
    const description = describeFilter(fields[key], filters[key]);

    return description === undefined ? [] : [{ key, description }];
  });

  const setFilter = (key: Extract<keyof Filters, string>, value: unknown): void => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClear = (): void => {
    onFiltersChange(keys.reduce((cleared, key) => ({ ...cleared, [key]: undefined }), filters));
  };

  return (
    <div role="search" aria-label={label} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {keys.map((key) => (
          <FilterControl
            key={key}
            name={key}
            field={fields[key]}
            value={filters[key]}
            onChange={(value) => {
              setFilter(key, value);
            }}
          />
        ))}
      </div>
      {pills.length === 0 ? undefined : (
        <div className="flex flex-wrap items-center gap-2">
          {pills.map(({ key, description }) => (
            <span key={key} className="flex items-center gap-2 rounded-full bg-primary/20 py-1 pr-1 pl-3 text-sm text-foreground">
              {description}
              <button
                type="button"
                aria-label={`Remove filter: ${description}`}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-primary/30 focus-visible:outline-2 focus-visible:outline-ring"
                onClick={() => {
                  setFilter(key, undefined);
                }}
              >
                <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </span>
          ))}
          <button
            type="button"
            className="rounded-full px-3 py-1 font-display text-xs tracking-widest text-primary uppercase hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            onClick={handleClear}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};
