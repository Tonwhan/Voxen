import { auth } from "@clerk/nextjs/server";
import { NavbarClient } from "./NavbarClient";

/**
 * Server Component wrapper for the Navbar.
 * Fetches auth state and delegates rendering to NavbarClient for scroll tracking.
 */
export async function Navbar() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return <NavbarClient isSignedIn={isSignedIn} />;
}
