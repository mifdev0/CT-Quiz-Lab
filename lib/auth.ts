import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

const sessionName = "ct_session";

export function hashPassword(password: string) {
  return createHash("sha256").update(`ct-mission:${password}`).digest("hex");
}

export async function getCurrentUser() {
  const userId = cookies().get(sessionName)?.value;
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true }
  });
}

export async function requireUser(role?: UserRole) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect("/login");
  return user;
}

export function setSession(userId: string) {
  cookies().set(sessionName, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSession() {
  cookies().delete(sessionName);
}
