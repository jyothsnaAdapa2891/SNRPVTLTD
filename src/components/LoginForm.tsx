"use client";

import { useActionState } from "react";
import { Loader2, Lock } from "lucide-react";
import { login } from "@/app/actions/auth";
import { Field, TextInput, Button } from "./ui";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm animate-in"
    >
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold">
          <Lock size={18} strokeWidth={2.2} />
        </span>
        <h1 className="mt-3 text-lg font-bold text-navy">Admin Sign In</h1>
        <p className="mt-1 text-sm text-slate-500">
          SNR Quote Creator · restricted access
        </p>
      </div>

      <div className="space-y-4">
        <Field label="Username">
          <TextInput
            name="username"
            autoComplete="username"
            autoFocus
            required
          />
        </Field>
        <Field label="Password">
          <TextInput
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
      </div>

      {state?.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Button type="submit" className="mt-6 w-full" disabled={pending}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        Sign In
      </Button>

      <p className="mt-4 text-center text-[12px] text-slate-400">
        Access is limited to admins. There is no self-signup.
      </p>
    </form>
  );
}
