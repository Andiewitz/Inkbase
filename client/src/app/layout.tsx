import type { Metadata } from "next";
import { Inter, Lobster_Two } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const lobsterTwo = Lobster_Two({
  variable: "--font-lobster",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Inkbase",
  description: "Next.js client with a Go backend",
  icons: {
    icon: [
      { url: "/favicon.svg", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.svg", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lobsterTwo.variable} h-full font-[family-name:var(--font-inter)] antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
