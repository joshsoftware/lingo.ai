"use client";
import Hero from "./Hero";
import Features from "./Features";
import UseCases from "./UseCases";
import CallToAction from "./CallToAction";
import Footer from "./Footer";
import { secondaryFont } from "@/fonts";

const Landing = () => {
  return (
    <div
      className={`min-h-screen bg-background flex flex-col ${secondaryFont.className}`}
    >
      <Hero />
      <Features />
      <UseCases />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Landing;
