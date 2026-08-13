import Head from "next/head";
import { HeroSection } from "../components/hero-section";
import { FeaturesSection } from "../components/features-section";

export function LandingPage() {
  return (
    <>
      <Head>
        <title>Inkbase — PR reviews, but for writing</title>
        <meta
          name="description"
          content="Inkbase reviews your manuscript line by line — suggesting edits, checking consistency, and helping you ship your best story."
        />
      </Head>
      <HeroSection />
      <FeaturesSection />
    </>
  );
}
