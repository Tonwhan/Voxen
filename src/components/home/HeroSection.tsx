import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TechBadge } from "./TechBadge"

type HeroSectionProps = {}

/**
 * The main hero section for the landing page.
 */
export function HeroSection({}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container relative z-10 mx-auto px-6 text-center">
        <div className="mb-8 flex justify-center gap-3">
          <TechBadge label="AMD MI300X" />
          <TechBadge label="Next.js 16" />
          <TechBadge label="Qwen3-8B" />
        </div>
        
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-text lg:text-7xl">
          AI-Powered CAD <br />
          <span className="text-accent">Assembly Generator</span>
        </h1>
        
        <p className="mx-auto mb-10 max-w-2xl text-lg text-text-muted lg:text-xl">
          Generate assembly-aware 3D models from natural language. 
          Discrete parts, labeled, and ready for your CAD workflow.
        </p>
        
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="h-12 px-8 text-base font-semibold bg-accent hover:bg-accent-hover text-white">
            <Link href="/workspace">Start Generating</Link>
          </Button>
          <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold border-border text-text hover:bg-surface">
            View Samples
          </Button>
        </div>
      </div>
    </section>
  )
}
