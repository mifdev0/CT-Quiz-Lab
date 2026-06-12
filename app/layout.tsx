import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CT Quiz Lab",
  description: "Media pembelajaran interaktif berbasis Computational Thinking untuk siswa SMP."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
