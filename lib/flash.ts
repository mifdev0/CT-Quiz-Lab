import { cookies } from "next/headers";

const flashName = "ct_flash";

export type FlashMessage = {
  type: "success" | "error";
  message: string;
};

export function setFlash(type: FlashMessage["type"], message: string) {
  cookies().set(flashName, JSON.stringify({ type, message }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 8
  });
}

export function getFlash(): FlashMessage | null {
  const value = cookies().get(flashName)?.value;
  if (!value) return null;
  try {
    return JSON.parse(value) as FlashMessage;
  } catch {
    return null;
  }
}
