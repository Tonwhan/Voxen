import Image from "next/image";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

const NAV_LINKS = [
  { label: "ADVANTAGES", href: "#advantages" },
  { label: "FEATURES", href: "#features" },
  { label: "BENCHMARKS", href: "#benchmarks" },
];

export async function Navbar() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/5 animate-fade-down">
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center relative">
        {/* Left Side: Logo */}
        <div className="flex-1 flex items-center">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="relative w-9 h-9">
              <Image
                src="/icon/oryxenlab.svg"
                alt="Oryxenlab"
                fill
                priority
                loading="eager"
                className="object-contain"
              />
            </div>
            <span
              className="text-white text-xl uppercase"
              style={{ fontFamily: "var(--font-mono)", fontWeight: 300 }}
            >
              VOXEN
            </span>
          </Link>
        </div>

        {/* Center: Navigation Menu */}
        <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-white/40 hover:text-white text-xs tracking-[0.15em] uppercase transition-colors duration-200"
              style={{ fontFamily: "var(--font-mono)", fontWeight: 300 }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side: Auth Buttons */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal"><button className="text-xs tracking-wide uppercase text-white/60 hover:text-white px-4 py-2 rounded-[4px] border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer">Sign In</button></SignInButton>
              <SignUpButton mode="modal"><button className="text-xs tracking-wide uppercase bg-[#FF6B00] hover:bg-[#FF8C33] text-white px-5 py-2 rounded-[4px] transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] cursor-pointer">Get Started</button></SignUpButton>
            </>
          ) : (
            <UserButton />
          )}
        </div>
      </div>
    </nav>
  );
}
