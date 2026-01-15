"use client";

import { useFormState } from "react-dom";

import { staffLogin } from "@/actions/auth";

const initialState = { success: false as const, error: "" };

export const StaffLoginForm = () => {
  const [state, action] = useFormState(staffLogin, initialState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        />
      </div>
      {"error" in state && state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Sign in
      </button>
    </form>
  );
};
