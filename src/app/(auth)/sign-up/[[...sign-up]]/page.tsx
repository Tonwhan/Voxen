import { Footer } from "@/components/home/Footer";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      appearance={{
        layout: {
          animations: false,
        },
        elements: {
          formButtonPrimary:
            "!bg-[#1a1a1a] !border !border-[#333] !text-[#444] hover:!bg-[#222] hover:!text-white !text-sm !font-medium !transition-all !rounded-xl !py-3 !shadow-none !normal-case !tracking-normal",
          card: "!bg-transparent !border-none !shadow-none",
          header: "!hidden",
          footer: "!hidden",
          headerSubtitle: "!hidden",
          socialButtonsBlockButton:
            "!bg-[#1a1a1a] !border !border-[#333] hover:!bg-[#222] !text-white !transition-all !rounded-xl !h-12",
          socialButtonsBlockButtonText: "!text-white !font-medium",
          formFieldLabel: "!text-white !text-sm !font-normal !mb-2",
          formFieldInput:
            "!bg-[#1a1a1a] !border !border-[#333] !text-white !placeholder:text-white/20 focus:!border-[#444] focus:!ring-0 !transition-all !rounded-xl !py-3 !px-4",
          footerActionText: "!text-[#444]",
          footerActionLink:
            "!text-[#888] hover:!text-white !transition-colors !font-medium",
          identityPreviewText: "!text-white",
          identityPreviewEditButtonIcon: "!text-[#888]",
          formFieldAction: "!text-[#888] hover:!text-white",
          formFieldInputShowPasswordIcon: "!text-white/50 hover:!text-white",
          formFieldInputShowPasswordButton: "!outline-none !shadow-none !focus:outline-none !focus:ring-0 !focus:shadow-none",
          dividerLine: "!bg-[#222]",
          dividerText: "!text-[#444] !text-xs !font-medium",
        },
      }}
    />
  );
}
