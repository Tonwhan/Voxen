import { HeroSection } from "@/components/home/HeroSection"
import { FeatureCard } from "@/components/home/FeatureCard"
import { Layers, MousePointer2, Download, Cpu } from "lucide-react"

/**
 * Public landing page for Voxen.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <main className="flex-1">
        <HeroSection />
        
        <section className="container mx-auto px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text sm:text-4xl">Engineered for CAD Workflows</h2>
            <p className="mt-4 text-text-muted">Beyond single-mesh blobs. Real parts for real engineering.</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard 
              title="Assembly Aware"
              description="Generated models consist of discrete, labeled parts with distinct geometries."
              icon={<Layers size={24} />}
            />
            <FeatureCard 
              title="Interactive Inspection"
              description="Select individual parts to view dimensions, materials, and design intent."
              icon={<MousePointer2 size={24} />}
            />
            <FeatureCard 
              title="CAD-Ready Export"
              description="Export parts or full assemblies as STL, OBJ, or professional STEP files."
              icon={<Download size={24} />}
            />
            <FeatureCard 
              title="AMD Powered"
              description="Lightning fast inference on AMD MI300X GPUs via ROCm stack."
              icon={<Cpu size={24} />}
            />
          </div>
        </section>

        <section className="border-t border-border bg-surface py-20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="mb-4 text-3xl font-bold text-text">Ready to build?</h2>
            <p className="mb-8 text-text-muted text-lg">Join the future of prompt-to-part engineering.</p>
            <div className="flex justify-center gap-4">
              <a 
                href="/workspace" 
                className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-8 font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Launch Workspace
              </a>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t border-border py-8 text-center text-sm text-text-muted">
        <p>© 2026 Oryxenlab. AMD AI Developers Hackathon.</p>
      </footer>
    </div>
  )
}
