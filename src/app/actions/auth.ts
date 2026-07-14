"use server";

import { redirect } from "next/navigation";
import { verifyCredentials } from "@/lib/admins";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Enter both username and password." };
  }

  if (!(await verifyCredentials(username, password))) {
    return { error: "Invalid username or password." };
  }

  await createSession(username);
  redirect("/");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
