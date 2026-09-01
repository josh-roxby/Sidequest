import { ThumbBlock } from "@/components/shell/ThumbBlock";
import { PhoneFrame } from "@/components/shell/PhoneFrame";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PhoneFrame>
      <main className="relative min-h-dvh">{children}</main>
      <ThumbBlock />
    </PhoneFrame>
  );
}
