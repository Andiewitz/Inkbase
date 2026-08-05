import { Geist, Geist_Mono, Lobster_Two } from "next/font/google";
import type { AppProps } from "next/app";
import "../app/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lobsterTwo = Lobster_Two({
  variable: "--font-lobster",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div
      className={`min-h-screen ${geistSans.variable} ${geistMono.variable} ${lobsterTwo.variable}`}
    >
      <Component {...pageProps} />
    </div>
  );
}
