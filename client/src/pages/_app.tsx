import { Inter, Lobster_Two } from "next/font/google";
import type { AppProps } from "next/app";
import "../globals.css";

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

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div
      className={`min-h-screen ${inter.variable} ${lobsterTwo.variable} font-[family-name:var(--font-inter)]`}
    >
      <Component {...pageProps} />
    </div>
  );
}
