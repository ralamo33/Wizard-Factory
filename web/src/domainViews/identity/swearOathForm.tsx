import { useForm } from "@tanstack/react-form";
import { type User, userSchema } from "@wizard/domain";
import { type JSX, useId } from "react";

import { PillSubmitButton } from "../../genericComponents/pill.tsx";
import { TextField } from "../../genericComponents/textField.tsx";

type OathValues = Readonly<{ name: string; age: string }>;
type OathField = keyof OathValues;
type OathResult = Awaited<ReturnType<(typeof userSchema)["~standard"]["validate"]>>;
type OathIssue = NonNullable<OathResult["issues"]>[number];

const oathFields: readonly OathField[] = ["name", "age"];

const validateOath = async (values: OathValues): Promise<OathResult> =>
  userSchema["~standard"].validate({
    name: values.name,
    age: values.age.trim() === "" ? Number.NaN : Number(values.age),
  });

const issueField = (issue: OathIssue): PropertyKey | undefined => {
  const segment = issue.path?.[0];

  return typeof segment === "object" ? segment.key : segment;
};

const messageFor = (issues: readonly OathIssue[], field: OathField): string | undefined =>
  issues.find((issue) => issueField(issue) === field)?.message;

const errorText = (errors: readonly unknown[]): string | undefined => errors.find((error): error is string => typeof error === "string");

type SwearOathFormProps = Readonly<{ onSwear: (user: User, onSworn: () => void) => void }>;

export const SwearOathForm = ({ onSwear }: SwearOathFormProps): JSX.Element => {
  const fieldIds: Readonly<Record<OathField, string>> = { name: useId(), age: useId() };
  const form = useForm({
    defaultValues: { name: "", age: "" },
    validators: {
      onSubmitAsync: async ({ value }) => {
        const { issues } = await validateOath(value);

        return issues === undefined ? undefined : { fields: { name: messageFor(issues, "name"), age: messageFor(issues, "age") } };
      },
    },
    onSubmit: async ({ value, formApi }) => {
      const result = await validateOath(value);

      if (result.issues === undefined) {
        onSwear(result.value, () => {
          formApi.reset();
        });
      }
    },
    onSubmitInvalid: ({ formApi }) => {
      const firstInvalid = oathFields.find((field) => (formApi.getFieldMeta(field)?.errors.length ?? 0) > 0);

      if (firstInvalid !== undefined) {
        document.getElementById(fieldIds[firstInvalid])?.focus();
      }
    },
  });

  return (
    <form
      className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-start"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <TextField
            id={fieldIds.name}
            name={field.name}
            label="Name"
            placeholder="Your name"
            value={field.state.value}
            error={errorText(field.state.meta.errors)}
            onChange={field.handleChange}
          />
        )}
      </form.Field>
      <form.Field name="age">
        {(field) => (
          <TextField
            id={fieldIds.age}
            name={field.name}
            label="Age"
            placeholder="Age"
            inputMode="numeric"
            className="sm:w-32"
            value={field.state.value}
            error={errorText(field.state.meta.errors)}
            onChange={field.handleChange}
          />
        )}
      </form.Field>
      <PillSubmitButton label="Swear the Oath" />
    </form>
  );
};
