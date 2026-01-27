import React from "react";

import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import HowToUseSection from "@/components/HowToUseSection";
import ExamplesSection from "@/components/ExamplesSection";
import CompatibilitySection from "@/components/CompatibilitySection";
import WhySection from "@/components/WhySection";
import AboutSection from "@/components/AboutSection";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen items-stretch font-sans">
      <main>
        <Hero />
        <WhySection />
        <CompatibilitySection />
        <ExamplesSection />
        <HowToUseSection />
        <div className="flex-1 flex flex-col gap-4 mt-16">
          <AboutSection />
          <FAQSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
