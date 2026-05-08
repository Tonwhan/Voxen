"use client";

import Image from "next/image";

export function WorkspaceHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Image
          src="/icon/oryxenlab.svg"
          alt="Oryxenlab"
          width={28}
          height={28}
          className="brightness-0 invert opacity-90"
          priority
          loading="eager"
        />
        <h2 className="text-xl font-bold text-text">Workspace</h2>
      </div>
      <p className="text-xs text-text-muted">
        Generate and manage your 3D parts
      </p>
    </div>
  );
}
