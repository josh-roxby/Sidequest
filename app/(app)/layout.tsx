import { NavSwitch } from "@/components/shell/NavSwitch";
import { PhoneFrame } from "@/components/shell/PhoneFrame";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PhoneFrame>
      <main className="relative h-full">{children}</main>
      <NavSwitch />
    </PhoneFrame>
  );
}
