import { BottomNav } from "@/components/shell/BottomNav";
import { PhoneFrame } from "@/components/shell/PhoneFrame";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PhoneFrame>
      <main
        className="relative"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {children}
      </main>
      <BottomNav />
    </PhoneFrame>
  );
}
