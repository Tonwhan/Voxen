import { Toaster } from "@/components/ui/sonner";

interface Layout {
  children: React.ReactNode;
}
export default function WorkspaceLayout({ children }: Layout) {
  return (
    <div className="flex flex-col h-screen w-full bg-background font-sans overflow-hidden">
      <main className="flex flex-1 w-full h-full">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
