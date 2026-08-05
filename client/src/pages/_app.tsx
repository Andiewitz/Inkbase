import { Geist, Geist_Mono } from "next/font/google";
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

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div
      className={`min-h-screen ${geistSans.variable} ${geistMono.variable}`}
    >
      <Component {...pageProps} />
    </div>
  );
}
