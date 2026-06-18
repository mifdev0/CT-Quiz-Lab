import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CT Quiz Lab",
  description: "Media pembelajaran interaktif berbasis Computational Thinking untuk siswa SMP."
};

// Neon production berada di Singapore. Menjalankan fungsi di region yang sama
// menghindari perjalanan jaringan lintas benua pada setiap query Prisma.
export const preferredRegion = "sin1";

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
