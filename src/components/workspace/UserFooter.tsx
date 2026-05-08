"use client";

import { UserButton, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

interface UserFooterProps {
  user:
    | {
        fullName: string | null;
        primaryEmailAddress?: { emailAddress: string } | null;
      }
    | null
    | undefined;
  isLoaded: boolean;
}

export function UserFooter({ user, isLoaded }: UserFooterProps) {
  return (
    <div className="bg-surface p-3 rounded-md border border-border flex items-center gap-3 shadow-sm mt-auto h-[58px]">
      {!isLoaded ? (
        <>
          <Skeleton className="w-8 h-8 rounded-full shrink-0 bg-gray-600" />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <Skeleton className="h-3 w-24 bg-gray-600" />
            <Skeleton className="h-2 w-16 bg-gray-600" />
          </div>
        </>
      ) : (
        <>
          <div className="w-8 h-8 flex items-center justify-center shrink-0 ">
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "!w-8 !h-8",
                },
              }}
            />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-bold text-text truncate">
              {user?.fullName ||
                user?.primaryEmailAddress?.emailAddress ||
                "Guest"}
            </span>
            <span className="text-[10px] text-text-muted truncate">
              Account Settings
            </span>
          </div>
        </>
      )}
    </div>
  );
}
