import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrueTerms | Check your contract",
  description: "Compare your employment contract with your original job offer.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
