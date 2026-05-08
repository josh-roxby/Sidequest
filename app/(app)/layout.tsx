import { BottomNav } from "@/components/shell/BottomNav";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { StatusBar } from "@/components/shell/StatusBar";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PhoneFrame>
      <StatusBar />
      <main className="relative">{children}</main>
      <BottomNav />
    </PhoneFrame>
  );
}
