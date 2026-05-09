import { Navbar } from "@/components/home/Navbar";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { InteractiveMockup } from "@/components/home/InteractiveMockup";
import { ComparisonSection } from "@/components/home/ComparisonSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CTASection } from "@/components/home/CTASection";
import { Footer } from "@/components/home/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />

      {/* Section Divider with Glow Beam */}
      <div className="relative z-20 -mt-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="relative h-px w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            {/* The Beam */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF6B00]/40 to-transparent blur-[2px] translate-x-[-100%] animate-[shimmer_4s_infinite]" />
          </div>
          <div className="mt-16 text-center">
            <p
              className="text-xs tracking-[0.5em] uppercase text-white/30"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Powering the next generation of engineering
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div id="features">
          <FeaturesGrid />
        </div>
        <div id="benchmarks">
          <InteractiveMockup />
        </div>
        <div id="comparison">
          <ComparisonSection />
        </div>
        <div id="advantages">
          <HowItWorks />
        </div>
        <CTASection />
      </div>

      <Footer />
    </main>
  );
}
