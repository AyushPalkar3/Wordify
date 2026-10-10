"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { signIn, signOut } from "@/lib/auth/auth";
import { loginSchema, signupSchema } from "@/lib/validation/auth";

export type AuthActionState = { error?: string } | undefined;

export async function signupAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, passwordHash },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // NEXT_REDIRECT is thrown by a successful signIn — let it propagate.
    if (error instanceof AuthError) {
      return {
        error: "Account created, but automatic sign-in failed. Please log in.",
      };
    }
    throw error;
  }
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Incorrect email or password" };
    }
    throw error;
  }
}

export async function signInWithGoogleAction(): Promise<AuthActionState> {
  try {
    await signIn("google", { redirectTo: "/dashboard" });
  } catch (error) {
    // NEXT_REDIRECT is thrown by a successful signIn — let it propagate.
    if (error instanceof AuthError) {
      // Covers a missing/invalid AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET as well
      // as the user declining on Google's consent screen — neither should
      // leak internals (env var names, stack traces) to the browser.
      return { error: "Google sign-in is unavailable right now. Please try again or use your email and password." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
