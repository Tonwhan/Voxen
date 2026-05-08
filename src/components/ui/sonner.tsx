"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-black group-[.toaster]:text-[#FF6B00] group-[.toaster]:border-[#FF6B00] group-[.toaster]:shadow-[0_0_15px_rgba(255,107,0,0.3)] group-[.toaster]:border-2",
          description: "group-[.toast]:text-[#FF6B00]/70",
          actionButton:
            "group-[.toast]:bg-[#FF6B00] group-[.toast]:text-black",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          icon: "text-[#FF6B00]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
