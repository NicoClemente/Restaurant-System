"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth";

type LoginResult = { success: true } | { success: false; error: string };

export const staffLogin = async (
  _prevState: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> => {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/kitchen",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid credentials" };
    }
    return { success: false, error: "Unexpected error" };
  }
};
