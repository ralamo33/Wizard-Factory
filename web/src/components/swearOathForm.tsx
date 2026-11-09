import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userSchema } from "@wizard/domain";
import { type JSX, useState } from "react";
import { trpc } from "../trpc.ts";

const inputClass =
  "w-full rounded-full border border-sky-200/20 bg-white/[0.04] px-5 py-3 text-white placeholder:text-slate-500 backdrop-blur focus:border-sky-300 focus:outline-none";

export const SwearOathForm = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const candidate = userSchema.safeParse({ name, age: Number(age) });
  const swearOath = useMutation(
    trpc.createUser.mutationOptions({
      onSuccess: async () => {
        setName("");
        setAge("");
        await queryClient.invalidateQueries({ queryKey: trpc.listUsers.queryKey() });
      },
    }),
  );

  return (
    <form
      className="mt-10 flex flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        if (candidate.success) {
          swearOath.mutate(candidate.data);
        }
      }}
    >
      <input className={inputClass} placeholder="Your name" value={name} onChange={(event) => { setName(event.target.value); }} />
      <input
        className={`${inputClass} sm:w-32`}
        placeholder="Age"
        inputMode="numeric"
        value={age}
        onChange={(event) => { setAge(event.target.value); }}
      />
      <button
        type="submit"
        disabled={!candidate.success || swearOath.isPending}
        className="shrink-0 rounded-full bg-sky-300 px-8 py-3 font-display tracking-widest text-slate-950 uppercase shadow-[0_0_30px_rgba(125,211,252,0.6)] transition enabled:hover:scale-105 enabled:hover:bg-white disabled:opacity-40"
      >
        Swear the Oath
      </button>
    </form>
  );
};
