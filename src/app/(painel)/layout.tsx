import Sidebar from "@/components/Sidebar";

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-brand-bgLight">
      <Sidebar />
      <div className="min-w-0 flex-1 text-[#111827]">{children}</div>
    </div>
  );
}
